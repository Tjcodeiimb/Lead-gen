"use server";
import { createHash } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { auditLog, candidates, companies, people, suppressionList } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { runClaudeWebFinder } from "@/lib/finders/claude-web";
import { runApolloFinder, revealApolloCandidate } from "@/lib/finders/apollo";
import { runSignalsFinder } from "@/lib/finders/signals";
import { findEmailForCandidate, findEmailForPerson } from "@/lib/finders/hunter";

type R = { ok: true; found: number; note?: string } | { ok: false; error: string };
const sha = (s: string) => createHash("sha256").update(s.trim().toLowerCase()).digest("hex");

export async function launchFinder(campaignId: string, source: "claude_web" | "apollo" | "signals"): Promise<R> {
  const user = await requireUser();
  try {
    let found = 0; let note: string | undefined;
    if (source === "claude_web") { const r = await runClaudeWebFinder(campaignId); found = r.found; note = `$${r.cost.toFixed(2)}`; }
    if (source === "apollo") { const r = await runApolloFinder(campaignId); found = r.found; }
    if (source === "signals") { const r = await runSignalsFinder(campaignId); found = r.found; note = r.log.join(" · "); }
    await db.insert(auditLog).values({ actor: `user:${user.email}`, action: `finder.${source}`, subjectType: "campaign", subjectId: campaignId, details: { found } });
    revalidatePath(`/campaigns/${campaignId}`);
    return { ok: true, found, note };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function revealCandidate(candidateId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireUser();
  try { const c = await revealApolloCandidate(candidateId); revalidatePath(`/campaigns/${c.campaignId}`); return { ok: true }; }
  catch (e) { return { ok: false, error: e instanceof Error ? e.message : "Unknown error" }; }
}

export async function findCandidateEmail(candidateId: string): Promise<{ ok: true; email: string | null } | { ok: false; error: string }> {
  await requireUser();
  try { const c = await findEmailForCandidate(candidateId); revalidatePath(`/campaigns/${c.campaignId}`); return { ok: true, email: c.email }; }
  catch (e) { return { ok: false, error: e instanceof Error ? e.message : "Unknown error" }; }
}

export async function findLeadEmail(personId: string): Promise<{ ok: true; email: string | null } | { ok: false; error: string }> {
  await requireUser();
  try { const p = await findEmailForPerson(personId); revalidatePath(`/leads/${personId}`); return { ok: true, email: p.email }; }
  catch (e) { return { ok: false, error: e instanceof Error ? e.message : "Unknown error" }; }
}

export async function dismissCandidates(ids: string[]) {
  await requireUser();
  if (!ids.length) return;
  const [c] = await db.update(candidates).set({ status: "dismissed" }).where(inArray(candidates.id, ids)).returning({ campaignId: candidates.campaignId });
  if (c) revalidatePath(`/campaigns/${c.campaignId}`);
}

/** Turns selected candidates into leads (companies + people). Suppressed or duplicate emails are skipped. */
export async function importCandidates(ids: string[]): Promise<{ ok: true; imported: number; skipped: number } | { ok: false; error: string }> {
  const user = await requireUser();
  if (!ids.length) return { ok: false, error: "Select at least one row." };
  const rows = await db.select().from(candidates).where(and(inArray(candidates.id, ids), eq(candidates.status, "new")));
  if (!rows.length) return { ok: false, error: "Nothing new to import." };
  const hashes = rows.map((r) => (r.email ? sha(r.email) : null)).filter((h): h is string => Boolean(h));
  const [sup, dup] = await Promise.all([
    hashes.length ? db.select({ h: suppressionList.valueHash }).from(suppressionList).where(and(eq(suppressionList.kind, "email"), inArray(suppressionList.valueHash, hashes))) : Promise.resolve([]),
    hashes.length ? db.select({ h: people.emailHash }).from(people).where(inArray(people.emailHash, hashes)) : Promise.resolve([]),
  ]);
  const blocked = new Set([...sup.map((s) => s.h), ...dup.map((d) => d.h)]);
  let imported = 0, skipped = 0;
  for (const r of rows) {
    const emailHash = r.email ? sha(r.email) : null;
    if (emailHash && blocked.has(emailHash)) { skipped++; await db.update(candidates).set({ status: "dismissed" }).where(eq(candidates.id, r.id)); continue; }
    let company = r.domain ? (await db.select().from(companies).where(eq(companies.domain, r.domain)))[0] : undefined;
    if (!company) [company] = await db.insert(companies).values({ name: r.companyName, domain: r.domain, hqCountry: r.companyCountry, industry: r.industry, employeeRange: r.employeeRange }).returning();
    const fullName = r.fullName && !/•/.test(r.fullName) ? r.fullName : null;
    const [p] = await db.insert(people).values({
      companyId: company.id, campaignId: r.campaignId,
      fullName: fullName ?? `Decision-maker at ${r.companyName}`, firstName: r.firstName, title: r.title, email: r.email, emailHash, emailStatus: r.emailStatus,
      linkedinUrl: r.linkedinUrl, country: r.companyCountry, source: r.source, sourceDescription: `Found by ${r.source} finder: ${r.signal ?? ""}`.trim(),
      lawfulBasis: "legitimate_interest", publicationEvidenceUrl: r.sourceUrl, notes: r.signal ? `Signal: ${r.signal}${r.signalUrl ? ` (${r.signalUrl})` : ""}` : null,
    }).returning({ id: people.id });
    await db.update(candidates).set({ status: "imported", personId: p.id }).where(eq(candidates.id, r.id));
    imported++;
  }
  await db.insert(auditLog).values({ actor: `user:${user.email}`, action: "candidates.import", subjectType: "campaign", subjectId: rows[0].campaignId, details: { imported, skipped } });
  revalidatePath(`/campaigns/${rows[0].campaignId}`); revalidatePath("/leads");
  return { ok: true, imported, skipped };
}
