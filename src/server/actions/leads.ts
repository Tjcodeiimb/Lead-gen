"use server";
import { createHash } from "node:crypto";
import Papa from "papaparse";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
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

  const text = await file.text();
  const parsed = Papa.parse<Row>(text, { header: true, skipEmptyLines: true });
  let inserted = 0, skipped = 0, suppressed = 0;
  for (const row of parsed.data) {
    const first = pick(row, "first_name", "firstname", "first");
    const last = pick(row, "last_name", "lastname", "last");
    const full = pick(row, "full_name", "name", "fullname") || `${first} ${last}`.trim();
    const companyName = pick(row, "company", "company_name", "organization", "organisation");
    if (!full || !companyName) { skipped++; continue; }
    const email = pick(row, "email", "work_email", "email_address") || null;
    const emailHash = email ? sha(email) : null;
    if (emailHash) {
      const [sup] = await db.select().from(suppressionList).where(and(eq(suppressionList.kind, "email"), eq(suppressionList.valueHash, emailHash)));
      if (sup) { suppressed++; continue; }
      const [dup] = await db.select({ id: people.id }).from(people).where(eq(people.emailHash, emailHash));
      if (dup) { skipped++; continue; }
    }
    const domain = normDomain(pick(row, "domain", "website", "company_domain", "url")) || (email && !/gmail|yahoo|outlook|hotmail/i.test(email) ? email.split("@")[1]?.toLowerCase() : null);
    const company = await upsertCompany(companyName, domain, {
      hqCountry: pick(row, "hq_country", "company_country", "country_code").slice(0, 2).toUpperCase() || null,
      industry: pick(row, "industry", "sector") || null,
      employeeRange: pick(row, "employees", "employee_range", "headcount", "size") || null,
      revenueBandUsd: pick(row, "revenue", "revenue_band") || null,
      linkedinUrl: pick(row, "company_linkedin") || null,
    });
    await db.insert(people).values({
      companyId: company.id, campaignId, firstName: first || null, lastName: last || null, fullName: full,
      title: pick(row, "title", "job_title", "position", "role") || null, email, emailHash,
      linkedinUrl: pick(row, "linkedin", "linkedin_url", "profile") || null,
      country: pick(row, "country", "person_country", "location_country").slice(0, 2).toUpperCase() || null,
      source, sourceDescription, lawfulBasis, notes: pick(row, "notes", "note") || null,
      publicationEvidenceUrl: pick(row, "publication_evidence_url", "evidence_url") || null,
    });
    inserted++;
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
    await db.update(people).set({ status: "new" }).where(eq(people.id, personId));
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
