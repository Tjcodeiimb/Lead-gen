"use server";
import { createHash } from "node:crypto";
import Papa from "papaparse";
import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { auditLog, companies, people, suppressionList } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { qualifyPerson } from "@/lib/jobs/qualify";
import { writeCopyForPerson } from "@/lib/jobs/copy";

const sha = (s: string) => createHash("sha256").update(s.trim().toLowerCase()).digest("hex");
const normDomain = (s?: string | null) => s ? s.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] : null;

type Row = Record<string, string>;
function pick(row: Row, ...keys: string[]) {
  for (const k of keys) {
    const hit = Object.keys(row).find((c) => c.trim().toLowerCase().replace(/[\s_-]/g, "") === k.replace(/[\s_-]/g, ""));
    if (hit && row[hit]?.trim()) return row[hit].trim();
  }
  return "";
}

async function upsertCompany(name: string, domain: string | null, extra: Partial<typeof companies.$inferInsert>) {
  if (domain) {
    const [existing] = await db.select().from(companies).where(eq(companies.domain, domain));
    if (existing) return existing;
  }
  const [c] = await db.insert(companies).values({ name, domain, ...extra }).returning();
  return c;
}

export async function importLeadsCsv(formData: FormData): Promise<{ ok: true; inserted: number; skipped: number; suppressed: number } | { ok: false; error: string }> {
  const user = await requireUser();
  const file = formData.get("file");
  const campaignId = (formData.get("campaignId") as string) || null;
  const source = (formData.get("source") as string) || "csv";
  const lawfulBasis = z.enum(["legitimate_interest", "consent", "existing_customer", "not_required", "unknown"]).parse(formData.get("lawfulBasis") ?? "unknown");
  const sourceDescription = (formData.get("sourceDescription") as string) || "";
  if (!(file instanceof File)) return { ok: false, error: "Choose a CSV file." };
  if (!sourceDescription) return { ok: false, error: "Describe where this list came from (required for the privacy notice)." };

  if (file.size > 5 * 1024 * 1024) return { ok: false, error: "That file is over 5 MB. Split it into smaller files." };
  const text = await file.text();
  const parsed = Papa.parse<Row>(text, { header: true, skipEmptyLines: true });
  if (parsed.data.length > 2000) return { ok: false, error: "That file has more than 2,000 rows. Split it into smaller files." };

  // Pass 1: normalise every row in memory.
  type Prepared = { first: string; last: string; full: string; companyName: string; email: string | null; emailHash: string | null; domain: string | null; row: Row };
  const prepared: Prepared[] = [];
  let skipped = 0;
  for (const row of parsed.data) {
    const first = pick(row, "first_name", "firstname", "first");
    const last = pick(row, "last_name", "lastname", "last");
    const full = pick(row, "full_name", "name", "fullname") || `${first} ${last}`.trim();
    const companyName = pick(row, "company", "company_name", "organization", "organisation");
    if (!full || !companyName) { skipped++; continue; }
    const email = pick(row, "email", "work_email", "email_address") || null;
    const domain = normDomain(pick(row, "domain", "website", "company_domain", "url")) || (email && !/gmail|yahoo|outlook|hotmail/i.test(email) ? email.split("@")[1]?.toLowerCase() ?? null : null);
    prepared.push({ first, last, full, companyName, email, emailHash: email ? sha(email) : null, domain, row });
  }

  // Pass 2: three bulk lookups instead of three queries per row.
  const hashes = prepared.map((p) => p.emailHash).filter((h): h is string => Boolean(h));
  const [suppressedRows, existingRows] = await Promise.all([
    hashes.length ? db.select({ h: suppressionList.valueHash }).from(suppressionList).where(and(eq(suppressionList.kind, "email"), inArray(suppressionList.valueHash, hashes))) : Promise.resolve([]),
    hashes.length ? db.select({ h: people.emailHash }).from(people).where(inArray(people.emailHash, hashes)) : Promise.resolve([]),
  ]);
  const suppressedSet = new Set(suppressedRows.map((r) => r.h));
  const existingSet = new Set(existingRows.map((r) => r.h));
  const seen = new Set<string>();
  let suppressed = 0;
  const toInsert = prepared.filter((p) => {
    if (p.emailHash) {
      if (suppressedSet.has(p.emailHash)) { suppressed++; return false; }
      if (existingSet.has(p.emailHash) || seen.has(p.emailHash)) { skipped++; return false; }
      seen.add(p.emailHash);
    }
    return true;
  });

  // Pass 3: upsert companies by domain in bulk, then insert people in batches.
  const domains = Array.from(new Set(toInsert.map((p) => p.domain).filter((d): d is string => Boolean(d))));
  const existingCompanies = domains.length ? await db.select().from(companies).where(inArray(companies.domain, domains)) : [];
  const companyByDomain = new Map(existingCompanies.map((c) => [c.domain!, c.id]));
  const newCompanies = toInsert
    .filter((p) => !p.domain || !companyByDomain.has(p.domain))
    .filter((p, i, arr) => !p.domain || arr.findIndex((q) => q.domain === p.domain) === i)
    .map((p) => ({
      name: p.companyName, domain: p.domain,
      hqCountry: pick(p.row, "hq_country", "company_country", "country_code").slice(0, 2).toUpperCase() || null,
      industry: pick(p.row, "industry", "sector") || null,
      employeeRange: pick(p.row, "employees", "employee_range", "headcount", "size") || null,
      revenueBandUsd: pick(p.row, "revenue", "revenue_band") || null,
      linkedinUrl: pick(p.row, "company_linkedin") || null,
    }));
  const companyByName = new Map<string, string>();
  for (let i = 0; i < newCompanies.length; i += 200) {
    const inserted = await db.insert(companies).values(newCompanies.slice(i, i + 200)).returning({ id: companies.id, domain: companies.domain, name: companies.name });
    for (const c of inserted) { if (c.domain) companyByDomain.set(c.domain, c.id); else companyByName.set(c.name, c.id); }
  }
  const peopleRows = toInsert.map((p) => ({
    companyId: (p.domain ? companyByDomain.get(p.domain) : companyByName.get(p.companyName)) ?? null,
    campaignId, firstName: p.first || null, lastName: p.last || null, fullName: p.full,
    title: pick(p.row, "title", "job_title", "position", "role") || null, email: p.email, emailHash: p.emailHash,
    linkedinUrl: pick(p.row, "linkedin", "linkedin_url", "profile") || null,
    country: pick(p.row, "country", "person_country", "location_country").slice(0, 2).toUpperCase() || null,
    source, sourceDescription, lawfulBasis, notes: pick(p.row, "notes", "note") || null,
    publicationEvidenceUrl: pick(p.row, "publication_evidence_url", "evidence_url") || null,
  }));
  let inserted = 0;
  for (let i = 0; i < peopleRows.length; i += 200) {
    const r = await db.insert(people).values(peopleRows.slice(i, i + 200)).onConflictDoNothing().returning({ id: people.id });
    inserted += r.length;
  }
  await db.insert(auditLog).values({ actor: `user:${user.email}`, action: "leads.import", details: { file: file.name, inserted, skipped, suppressed, source, lawfulBasis } });
  revalidatePath("/leads");
  return { ok: true, inserted, skipped, suppressed };
}

export async function createLead(formData: FormData) {
  const user = await requireUser();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const companyName = String(formData.get("company") ?? "").trim();
  if (!fullName || !companyName) throw new Error("Name and company are required.");
  const email = String(formData.get("email") ?? "").trim() || null;
  const domain = normDomain(String(formData.get("domain") ?? ""));
  const company = await upsertCompany(companyName, domain, { hqCountry: String(formData.get("hqCountry") ?? "").slice(0, 2).toUpperCase() || null });
  const [p] = await db.insert(people).values({
    companyId: company.id, campaignId: (formData.get("campaignId") as string) || null, fullName,
    firstName: fullName.split(" ")[0], title: String(formData.get("title") ?? "") || null, email, emailHash: email ? sha(email) : null,
    linkedinUrl: String(formData.get("linkedinUrl") ?? "") || null, country: String(formData.get("country") ?? "").slice(0, 2).toUpperCase() || null,
    source: "manual", sourceDescription: String(formData.get("sourceDescription") ?? "Added manually"), lawfulBasis: "legitimate_interest", notes: String(formData.get("notes") ?? "") || null,
  }).returning({ id: people.id });
  await db.insert(auditLog).values({ actor: `user:${user.email}`, action: "lead.create", subjectType: "person", subjectId: p.id });
  redirect(`/leads/${p.id}`);
}

export async function runQualify(personId: string): Promise<{ ok: true; tier: string; total: number } | { ok: false; error: string }> {
  await requireUser();
  try {
    const { score } = await qualifyPerson(personId);
    revalidatePath(`/leads/${personId}`); revalidatePath("/leads");
    return { ok: true, tier: score.tier, total: score.total };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function runCopy(personId: string): Promise<{ ok: true; flags: string[] } | { ok: false; error: string }> {
  await requireUser();
  try {
    const { flags } = await writeCopyForPerson(personId);
    revalidatePath(`/leads/${personId}`); revalidatePath("/leads"); revalidatePath("/review");
    return { ok: true, flags };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

/** Qualify, then (for A and B) write copy and queue for review. */
export async function runPipeline(personId: string): Promise<{ ok: true; tier: string; copied: boolean } | { ok: false; error: string }> {
  await requireUser();
  try {
    const { score } = await qualifyPerson(personId);
    let copied = false;
    if (score.tier === "A" || score.tier === "B") { await writeCopyForPerson(personId); copied = true; }
    revalidatePath(`/leads/${personId}`); revalidatePath("/leads"); revalidatePath("/review");
    return { ok: true, tier: score.tier, copied };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function suppressLead(personId: string, reason: "manual" | "unsubscribed" | "objection") {
  const user = await requireUser();
  const [p] = await db.select().from(people).where(eq(people.id, personId));
  if (!p) return;
  if (p.emailHash) await db.insert(suppressionList).values({ kind: "email", valueHash: p.emailHash, reason, note: `by ${user.email}` }).onConflictDoNothing();
  await db.update(people).set({ status: "do_not_contact", doNotContact: true }).where(eq(people.id, personId));
  await db.insert(auditLog).values({ actor: `user:${user.email}`, action: "lead.suppress", subjectType: "person", subjectId: personId, details: { reason } });
  revalidatePath(`/leads/${personId}`); revalidatePath("/leads"); revalidatePath("/review");
}
