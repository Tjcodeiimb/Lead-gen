import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { agentRuns, companies, evidence, people, scores } from "@/db/schema";
import { claude, isMock } from "@/lib/claude/client";
import { MODELS } from "@/lib/claude/models";
import { costFromUsage } from "@/lib/claude/pricing";
import { runJob } from "@/lib/claude/runner";
import { QualifierSchema } from "@/lib/claude/schemas/qualify";
import { qualifySystemPrompt, RESEARCH_SYSTEM, QUALIFY_PROMPT_VERSION, RESEARCH_PROMPT_VERSION } from "@/lib/claude/prompts/qualify";
import { scoreQualification, RUBRIC_VERSION } from "@/lib/claude/scoring";
import { mockEvidence, mockQualifier } from "./mocks";

type EvidenceRow = { evidence_id: string; criteria: string[]; claim: string; url: string | null; title: string | null; cited_text: string | null; published_date: string; source_type: string };

const RESEARCH_TTL_DAYS = 30;

/**
 * Researches a company with Claude web search + fetch and stores an evidence ledger.
 * Findings without citations are dropped: evidence ids come only from real citation objects.
 */
export async function researchCompany(companyId: string, lead: { fullName: string; title: string | null }) {
  const [co] = await db.select().from(companies).where(eq(companies.id, companyId));
  if (!co) throw new Error("Company not found");

  const fresh = co.lastResearchedAt && Date.now() - co.lastResearchedAt.getTime() < RESEARCH_TTL_DAYS * 86_400_000;
  if (fresh) return db.select().from(evidence).where(eq(evidence.companyId, companyId));

  const started = Date.now();
  const [run] = await db.insert(agentRuns).values({
    jobType: "research", subjectType: "company", subjectId: companyId, status: "running",
    model: MODELS.sonnet, effort: "medium", promptVersion: RESEARCH_PROMPT_VERSION, mode: isMock() ? "mock" : "live",
  }).returning({ id: agentRuns.id });

  let rows: EvidenceRow[] = [];
  let costUsd = 0;
  try {
    if (isMock()) {
      await new Promise((r) => setTimeout(r, 800));
      rows = mockEvidence(co.name, co.domain);
    } else {
      const today = new Date().toISOString().slice(0, 10);
      const user = `<today>${today}</today>\n<lead>\nCompany: ${co.name} | Domain (may be wrong): ${co.domain ?? "unknown"} | HQ: ${co.hqCountry ?? "unknown"}\nContact: ${lead.fullName} | Stated title: ${lead.title ?? "unknown"}\n</lead>\nUseful pages to consider fetching: https://${co.domain ?? "example.com"}/about , https://${co.domain ?? "example.com"}/press\nResearch this lead now.`;
      const req = {
        model: MODELS.sonnet, max_tokens: 6000,
        system: [{ type: "text" as const, text: RESEARCH_SYSTEM, cache_control: { type: "ephemeral" as const } }],
        tools: [
          { type: "web_search_20260318" as const, name: "web_search" as const, max_uses: 5, blocked_domains: ["linkedin.com", "zoominfo.com", "rocketreach.co", "contactout.com", "signalhire.com"], ...(co.hqCountry ? { user_location: { type: "approximate" as const, country: co.hqCountry } } : {}) },
          { type: "web_fetch_20260318" as const, name: "web_fetch" as const, max_uses: 3, citations: { enabled: true }, max_content_tokens: 6000, blocked_domains: ["linkedin.com"] },
        ],
        output_config: { effort: "medium" as const },
      };
      let messages: Array<{ role: "user" | "assistant"; content: unknown }> = [{ role: "user", content: user }];
      let res;
      for (let i = 0; i < 4; i++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        res = await claude().messages.create({ ...req, messages: messages as any });
        costUsd += costFromUsage(MODELS.sonnet, res.usage).usd;
        if (res.stop_reason !== "pause_turn") break;
        messages = [...messages, { role: "assistant", content: res.content }];
      }
      if (!res) throw new Error("No response");
      rows = harvestFindings(res.content);
      const u = res.usage;
      await db.update(agentRuns).set({ inputTokens: u.input_tokens, outputTokens: u.output_tokens, cacheReadTokens: u.cache_read_input_tokens ?? 0, webSearches: u.server_tool_use?.web_search_requests ?? 0, stopReason: res.stop_reason }).where(eq(agentRuns.id, run.id));
    }

    await db.delete(evidence).where(eq(evidence.companyId, companyId));
    if (rows.length) {
      await db.insert(evidence).values(rows.map((r) => ({
        companyId, agentRunId: run.id, evidenceId: r.evidence_id, criteria: r.criteria, claim: r.claim,
        url: r.url, title: r.title, citedText: r.cited_text, publishedDate: r.published_date, sourceType: r.source_type,
      })));
    }
    await db.update(companies).set({ lastResearchedAt: new Date() }).where(eq(companies.id, companyId));
    await db.update(agentRuns).set({ status: "succeeded", output: { findings: rows.length }, costUsd: costUsd.toFixed(6), latencyMs: Date.now() - started }).where(eq(agentRuns.id, run.id));
  } catch (e) {
    await db.update(agentRuns).set({ status: "failed", error: e instanceof Error ? e.message : String(e), latencyMs: Date.now() - started }).where(eq(agentRuns.id, run.id));
    throw e;
  }
  return db.select().from(evidence).where(eq(evidence.companyId, companyId));
}

/**
 * Code, not the model, builds the evidence pack from API citation objects.
 *
 * The API splits the answer into many text blocks: citations attach to the block holding the cited
 * sentence, while the "FINDING [C2] (date: ...)" prefix often sits in a separate block. So we stitch
 * all text together, remember which character range each block's citations cover, and give each
 * FINDING line every citation that overlaps it. A FINDING with no citation is dropped.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function harvestFindings(content: any[]): EvidenceRow[] {
  let full = "";
  const spans: { start: number; end: number; citations: { url?: string; title?: string; cited_text?: string; type?: string }[] }[] = [];
  for (const block of content) {
    if (block?.type !== "text" || typeof block.text !== "string") continue;
    const start = full.length;
    full += block.text;
    if (Array.isArray(block.citations) && block.citations.length) spans.push({ start, end: full.length, citations: block.citations });
  }

  const out: EvidenceRow[] = [];
  const lineRe = /^FINDING\s*\[([^\]]*)\]\s*\(date:\s*([^)]*)\)\s*:\s*(.+)$/gm;
  let m: RegExpExecArray | null;
  while ((m = lineRe.exec(full)) !== null) {
    const lineStart = m.index;
    const lineEnd = m.index + m[0].length;
    const cites = spans.filter((sp) => sp.start < lineEnd && sp.end > lineStart).flatMap((sp) => sp.citations);
    const c = cites.find((x) => x.url) ?? cites[0];
    if (!c) continue;
    out.push({
      evidence_id: `E${out.length + 1}`,
      criteria: m[1].split(",").map((x) => x.trim()).filter(Boolean),
      claim: m[3].trim(),
      url: c.url ?? null,
      title: c.title ?? null,
      cited_text: cites.map((x) => x.cited_text).filter(Boolean).join(" … ").slice(0, 1000) || null,
      published_date: m[2].trim() || "undated",
      source_type: c.type === "web_search_result_location" ? "web_search" : "web_fetch",
    });
  }
  return out;
}

/** Qualifies one person: research (cached per company) → Qualifier → deterministic score → tier → review row. */
export async function qualifyPerson(personId: string) {
  const [p] = await db.select().from(people).where(eq(people.id, personId));
  if (!p) throw new Error("Lead not found");
  await db.update(people).set({ status: "qualifying" }).where(eq(people.id, personId));

  let co = p.companyId ? (await db.select().from(companies).where(eq(companies.id, p.companyId)))[0] : undefined;
  if (!co) {
    [co] = await db.insert(companies).values({ name: p.fullName + " (unknown company)" }).returning();
    await db.update(people).set({ companyId: co.id }).where(eq(people.id, personId));
  }

  const ev = await researchCompany(co.id, { fullName: p.fullName, title: p.title });
  const evidencePack = {
    company: { name: co.name, domain: co.domain, hq_country: co.hqCountry },
    evidence: ev.map((e) => ({ id: e.evidenceId, criteria: e.criteria, claim: e.claim, url: e.url, published_date: e.publishedDate, cited_text: e.citedText })),
    user_input: { "INPUT:company": co.name, "INPUT:title": p.title, "INPUT:industry": co.industry, "INPUT:employee_range": co.employeeRange, "INPUT:revenue_band": co.revenueBandUsd, "INPUT:notes": p.notes },
  };
  const validIds = new Set<string>([...ev.map((e) => e.evidenceId), ...Object.keys(evidencePack.user_input)]);

  const { output, runId } = await runJob({
    jobType: "qualify", subjectType: "person", subjectId: p.id,
    model: MODELS.sonnet, effort: "medium", promptVersion: QUALIFY_PROMPT_VERSION, maxTokens: 6000,
    system: qualifySystemPrompt(),
    user: `<today>${new Date().toISOString().slice(0, 10)}</today>\n<lead_record>\n${JSON.stringify({ full_name: p.fullName, title: p.title, country: p.country, company: co.name }, null, 2)}\n</lead_record>\n<evidence_pack>\n${JSON.stringify(evidencePack, null, 2)}\n</evidence_pack>\nQualify this lead against the rubric. Use only evidence ids that appear in the evidence pack.`,
    schema: QualifierSchema,
    mock: () => mockQualifier({ fullName: p.fullName, title: p.title, company: co!.name }),
  });

  const s = scoreQualification(output, validIds);
  await db.update(scores).set({ isCurrent: false }).where(and(eq(scores.personId, p.id), eq(scores.isCurrent, true)));
  await db.insert(scores).values({
    personId: p.id, agentRunId: runId, rubricVersion: RUBRIC_VERSION, levels: s.levels, points: s.points, total: s.total,
    tier: s.tier, confidence: output.confidence, primaryOffer: s.primaryOffer, reviewerSummary: output.reviewer_summary,
    hooks: output.personalization_hooks, flags: [...output.review_flags, ...(s.escalate ? [`escalate:${s.escalationReason}`] : [])], raw: output,
  });
  const status = s.tier === "DQ" ? "disqualified" : s.tier === "NEEDS_RESEARCH" ? "needs_research" : "qualified";
  await db.update(people).set({ status, tier: s.tier, score: s.total }).where(eq(people.id, p.id));
  return { score: s, output };
}
