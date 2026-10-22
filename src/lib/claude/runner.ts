/**
 * Every Claude call in the app goes through runJob(). It:
 *  - checks the pause_llm kill switch and the monthly budget,
 *  - calls the API with a strict JSON schema (structured outputs),
 *  - records tokens, cost and latency in agent_runs,
 *  - returns realistic fixtures in mock mode so the app works without a key.
 */
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { eq, gte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { agentRuns, settings } from "@/db/schema";
import { claude, isMock } from "./client";
import { costFromUsage } from "./pricing";
import type { Effort, ModelId } from "./models";

export type JobType = "campaign_generate" | "prescreen" | "research" | "qualify" | "adjudicate" | "copy" | "reply_classify";

export type RunJobOptions<S extends z.ZodType> = {
  jobType: JobType;
  subjectType: "campaign" | "person" | "company";
  subjectId: string;
  model: ModelId;
  effort?: Effort;
  promptVersion: string;
  system: string;             // static, cacheable
  user: string;               // dynamic
  schema: S;
  maxTokens?: number;
  mock: () => z.infer<S>;
};

export async function assertLlmAllowed() {
  const [pause] = await db.select().from(settings).where(eq(settings.key, "pause_llm"));
  if (pause?.value === true) throw new Error("LLM jobs are paused (Settings → Kill switches).");
  const [budget] = await db.select().from(settings).where(eq(settings.key, "monthly_budget_usd"));
  const limit = Number(budget?.value ?? 0);
  if (limit > 0) {
    const monthStart = new Date();
    monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
    const [{ spent }] = await db
      .select({ spent: sql<string>`coalesce(sum(${agentRuns.costUsd}), 0)` })
      .from(agentRuns)
      .where(gte(agentRuns.createdAt, monthStart));
    if (Number(spent) >= limit) throw new Error(`Monthly Claude budget of $${limit} reached. Raise it in Settings.`);
  }
}

export async function runJob<S extends z.ZodType>(o: RunJobOptions<S>): Promise<{ output: z.infer<S>; runId: string; costUsd: number }> {
  await assertLlmAllowed();
  const started = Date.now();
  const [run] = await db.insert(agentRuns).values({
    jobType: o.jobType, subjectType: o.subjectType, subjectId: o.subjectId, status: "running",
    model: o.model, effort: o.effort ?? null, promptVersion: o.promptVersion, mode: isMock() ? "mock" : "live",
    input: { system_chars: o.system.length, user: o.user.slice(0, 20_000) },
  }).returning({ id: agentRuns.id });

  if (isMock()) {
    await new Promise((r) => setTimeout(r, 600));
    const output = o.schema.parse(o.mock()) as z.infer<S>;
    await db.update(agentRuns).set({ status: "succeeded", output, stopReason: "mock", latencyMs: Date.now() - started, costUsd: "0" }).where(eq(agentRuns.id, run.id));
    return { output, runId: run.id, costUsd: 0 };
  }

  try {
    const res = await claude().messages.parse({
      model: o.model,
      max_tokens: o.maxTokens ?? 4000,
      system: [{ type: "text", text: o.system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: o.user }],
      output_config: { format: zodOutputFormat(o.schema), ...(o.effort ? { effort: o.effort } : {}) },
    });
    const cost = costFromUsage(o.model, res.usage);
    if (res.stop_reason === "refusal" || !res.parsed_output) {
      await db.update(agentRuns).set({ status: "needs_human", stopReason: res.stop_reason, latencyMs: Date.now() - started, costUsd: cost.usd.toFixed(6), inputTokens: cost.input, outputTokens: cost.output, cacheReadTokens: cost.cacheRead, cacheWriteTokens: cost.cacheWrite }).where(eq(agentRuns.id, run.id));
      throw new Error(`Claude did not return a usable answer (stop_reason=${res.stop_reason}).`);
    }
    const output = res.parsed_output as z.infer<S>;
    await db.update(agentRuns).set({
      status: "succeeded", output, stopReason: res.stop_reason, latencyMs: Date.now() - started,
      costUsd: cost.usd.toFixed(6), inputTokens: cost.input, outputTokens: cost.output, cacheReadTokens: cost.cacheRead, cacheWriteTokens: cost.cacheWrite,
    }).where(eq(agentRuns.id, run.id));
    return { output, runId: run.id, costUsd: cost.usd };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await db.update(agentRuns).set({ status: "failed", error: message, latencyMs: Date.now() - started }).where(eq(agentRuns.id, run.id));
    throw e;
  }
}
