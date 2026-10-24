/**
 * Finder 4: Hunter.io email finder and verifier. Free plan: 25 finds and 50 verifications a month.
 * Works on a candidate (before import) or a lead (after import).
 */
import { eq } from "drizzle-orm";
import { createHash } from "node:crypto";
import { db } from "@/db/client";
import { candidates, people, companies } from "@/db/schema";
import { getKey } from "@/lib/integrations/keys";
import { mockMode } from "./common";

type Finder = { data?: { email?: string | null; score?: number; verification?: { status?: string | null } | null } };
type Verifier = { data?: { status?: string; score?: number } };

export type EmailResult = { email: string | null; status: "valid" | "valid_catchall_validated" | "risky_catch_all" | "unknown" | "invalid" | "role_based" | "disposable"; score: number | null };

function mapStatus(s?: string | null): EmailResult["status"] {
  switch (s) {
    case "valid": return "valid";
    case "accept_all": return "risky_catch_all";
    case "invalid": return "invalid";
    case "disposable": return "disposable";
    case "webmail": return "unknown";
    default: return "unknown";
  }
}

export async function findEmail(input: { firstName?: string | null; lastName?: string | null; fullName?: string | null; domain?: string | null; company?: string | null }): Promise<EmailResult> {
  const key = await getKey("hunter_api_key");
  if (mockMode() || !key) {
    if (!key && !mockMode()) throw new Error("Add your Hunter API key in Settings → Integrations first.");
    const first = (input.firstName ?? input.fullName?.split(" ")[0] ?? "hello").toLowerCase();
    const dom = input.domain ?? `${(input.company ?? "example").toLowerCase().replace(/[^a-z]/g, "")}.example`;
    return { email: `${first}@${dom}`, status: "valid", score: 92 };
  }
  if (!input.domain && !input.company) throw new Error("Need a company website or name to find an email.");
  const url = new URL("https://api.hunter.io/v2/email-finder");
  if (input.domain) url.searchParams.set("domain", input.domain); else url.searchParams.set("company", input.company!);
  if (input.firstName && input.lastName) { url.searchParams.set("first_name", input.firstName); url.searchParams.set("last_name", input.lastName); }
  else url.searchParams.set("full_name", input.fullName ?? "");
  const res = await fetch(url, { headers: { "X-API-KEY": key }, cache: "no-store" });
  if (res.status === 401) throw new Error("Hunter rejected the API key. Check Settings → Integrations.");
  if (res.status === 429) throw new Error("Hunter monthly quota or rate limit reached.");
  if (!res.ok) throw new Error(`Hunter error ${res.status}`);
  const data = (await res.json()) as Finder;
  const email = data.data?.email ?? null;
  return { email, status: email ? mapStatus(data.data?.verification?.status) : "unknown", score: data.data?.score ?? null };
}

export async function verifyEmail(email: string): Promise<EmailResult> {
  const key = await getKey("hunter_api_key");
  if (mockMode() || !key) return { email, status: "valid", score: 90 };
  const url = new URL("https://api.hunter.io/v2/email-verifier"); url.searchParams.set("email", email);
  for (let i = 0; i < 3; i++) {
    const res = await fetch(url, { headers: { "X-API-KEY": key }, cache: "no-store" });
    if (res.status === 202) { await new Promise((r) => setTimeout(r, 3000)); continue; }
    if (!res.ok) throw new Error(`Hunter verifier error ${res.status}`);
    const data = (await res.json()) as Verifier;
    return { email, status: mapStatus(data.data?.status), score: data.data?.score ?? null };
  }
  return { email, status: "unknown", score: null };
}

export async function findEmailForCandidate(candidateId: string) {
  const [c] = await db.select().from(candidates).where(eq(candidates.id, candidateId));
  if (!c) throw new Error("Candidate not found");
  if (!c.fullName) throw new Error("Find the person first; this row is a company only.");
  const parts = c.fullName.split(" ");
  const r = await findEmail({ firstName: parts[0], lastName: parts.length > 1 && !/•/.test(parts[parts.length - 1]) ? parts[parts.length - 1] : null, fullName: c.fullName, domain: c.domain, company: c.companyName });
  const [u] = await db.update(candidates).set({ email: r.email, emailStatus: r.status }).where(eq(candidates.id, candidateId)).returning();
  return u;
}

export async function findEmailForPerson(personId: string) {
  const [p] = await db.select().from(people).where(eq(people.id, personId));
  if (!p) throw new Error("Lead not found");
  const co = p.companyId ? (await db.select().from(companies).where(eq(companies.id, p.companyId)))[0] : null;
  const r = await findEmail({ firstName: p.firstName, lastName: p.lastName, fullName: p.fullName, domain: co?.domain, company: co?.name });
  const emailHash = r.email ? createHash("sha256").update(r.email.trim().toLowerCase()).digest("hex") : null;
  const [u] = await db.update(people).set({ email: r.email ?? p.email, emailHash: emailHash ?? p.emailHash, emailStatus: r.status }).where(eq(people.id, personId)).returning();
  return u;
}
