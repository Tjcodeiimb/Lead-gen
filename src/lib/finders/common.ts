import { createHash } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { campaigns, candidates, finderRuns } from "@/db/schema";
import { isMock } from "@/lib/claude/client";
import { countryName, nicheKeywords, nicheLabel, roleTitles } from "@/lib/targeting";

export type Campaign = typeof campaigns.$inferSelect;
export type FinderSource = "claude_web" | "apollo" | "signals" | "hunter";

export type CandidateInput = {
  companyName: string; domain?: string | null; companyCountry?: string | null; companyCity?: string | null;
  industry?: string | null; employeeRange?: string | null;
  fullName?: string | null; firstName?: string | null; title?: string | null; email?: string | null;
  linkedinUrl?: string | null; externalId?: string | null;
  signal?: string | null; signalUrl?: string | null; sourceUrl?: string | null; confidence?: number | null;
};

export const normDomain = (s?: string | null) =>
  s ? s.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0] || null : null;

export function dedupeKey(campaignId: string, c: CandidateInput) {
  const company = (normDomain(c.domain) ?? c.companyName.trim().toLowerCase());
  const person = (c.fullName ?? "").trim().toLowerCase();
  return createHash("sha256").update(`${campaignId}|${company}|${person}`).digest("hex");
}

/** Inserts candidates, skipping ones already found for this campaign. Returns how many were new. */
export async function saveCandidates(campaignId: string, runId: string, source: FinderSource, items: CandidateInput[]) {
  if (!items.length) return 0;
  const rows = items
    .filter((c) => c.companyName?.trim())
    .map((c) => ({
      campaignId, finderRunId: runId, source,
      companyName: c.companyName.trim(), domain: normDomain(c.domain), companyCountry: c.companyCountry?.toUpperCase().slice(0, 2) || null,
      companyCity: c.companyCity || null, industry: c.industry || null, employeeRange: c.employeeRange || null,
      fullName: c.fullName?.trim() || null, firstName: c.firstName?.trim() || c.fullName?.trim().split(" ")[0] || null,
      title: c.title || null, email: c.email?.toLowerCase() || null, linkedinUrl: c.linkedinUrl || null, externalId: c.externalId || null,
      signal: c.signal || null, signalUrl: c.signalUrl || null, sourceUrl: c.sourceUrl || null, confidence: c.confidence ?? null,
      dedupeKey: dedupeKey(campaignId, c),
    }));
  // Collapse duplicates within this batch.
  const seen = new Set<string>();
  const unique = rows.filter((r) => (seen.has(r.dedupeKey) ? false : (seen.add(r.dedupeKey), true)));
  const inserted = await db.insert(candidates).values(unique).onConflictDoNothing().returning({ id: candidates.id });
  return inserted.length;
}

export async function startRun(campaignId: string, source: FinderSource, query: unknown) {
  const [run] = await db.insert(finderRuns).values({ campaignId, source, status: "running", query: query as object }).returning();
  return run;
}

export async function finishRun(runId: string, patch: { found: number; costUsd?: number; creditsUsed?: number; log?: string }) {
  await db.update(finderRuns).set({ status: "succeeded", found: patch.found, costUsd: (patch.costUsd ?? 0).toFixed(6), creditsUsed: patch.creditsUsed ?? 0, log: patch.log ?? null, finishedAt: new Date() }).where(eq(finderRuns.id, runId));
}

export async function failRun(runId: string, e: unknown) {
  await db.update(finderRuns).set({ status: "failed", error: e instanceof Error ? e.message : String(e), finishedAt: new Date() }).where(eq(finderRuns.id, runId));
}

/** A plain-English description of the campaign's target, reused by every finder and prompt. */
export function describeTarget(c: Campaign) {
  const where = [c.companyCity, countryName(c.companyCountry)].filter(Boolean).join(", ");
  const to = [c.targetCity, countryName(c.targetCountry)].filter(Boolean).join(", ");
  return {
    niche: nicheLabel(c.niche ?? "", c.subNiche),
    keywords: [...nicheKeywords(c.niche ?? "", c.subNiche), ...(c.keywords ? c.keywords.split(",").map((k) => k.trim()).filter(Boolean) : [])],
    companyLocation: where || "anywhere",
    targetMarket: to || "a new market",
    sizes: c.companySizes ?? [],
    titles: roleTitles(c.roles ?? []),
    summary: `${nicheLabel(c.niche ?? "", c.subNiche)} companies based in ${where || "any country"}${to ? ` that are entering or expanding to ${to}` : ""}`,
  };
}

export const mockMode = () => isMock();

export async function campaignOrThrow(campaignId: string) {
  const [c] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId));
  if (!c) throw new Error("Campaign not found");
  return c;
}

export async function candidateCounts(campaignId: string) {
  const [row] = await db.select({
    total: sql<number>`count(*)`,
    fresh: sql<number>`count(*) filter (where ${candidates.status} = 'new')`,
    withPerson: sql<number>`count(*) filter (where ${candidates.fullName} is not null)`,
    withEmail: sql<number>`count(*) filter (where ${candidates.email} is not null)`,
  }).from(candidates).where(eq(candidates.campaignId, campaignId));
  return { total: Number(row?.total ?? 0), fresh: Number(row?.fresh ?? 0), withPerson: Number(row?.withPerson ?? 0), withEmail: Number(row?.withEmail ?? 0) };
}
