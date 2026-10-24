/**
 * Email waterfall. Tries providers in order and moves to the next when one has no key, is out of
 * credits this month, returns a quota error, or finds nothing. Found addresses are verified when a
 * verifier is available. Every call is logged to provider_calls so the Integrations page shows meters.
 */
import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { candidates, companies, people } from "@/db/schema";
import { getJsonSetting, getKey, isExhausted, markExhausted, recordCall, type IntegrationKey } from "@/lib/integrations/keys";
import { mockMode } from "./common";

export type EmailStatus = "valid" | "valid_catchall_validated" | "risky_catch_all" | "unknown" | "invalid" | "role_based" | "disposable";
export type EmailResult = { email: string | null; status: EmailStatus; provider: string; score: number | null };
export type Person = { firstName?: string | null; lastName?: string | null; fullName?: string | null; domain?: string | null; company?: string | null; linkedinUrl?: string | null; apolloId?: string | null };

class QuotaError extends Error { quota = true; }

export const FINDER_ORDER_DEFAULT = ["hunter", "anymailfinder", "prospeo", "apollo"] as const;
export const VERIFIER_ORDER_DEFAULT = ["reoon", "hunter"] as const;

const KEY_FOR: Record<string, IntegrationKey> = { hunter: "hunter_api_key", anymailfinder: "anymailfinder_api_key", prospeo: "prospeo_api_key", apollo: "apollo_api_key", reoon: "reoon_api_key" };

function names(p: Person) {
  const full = p.fullName?.trim() || [p.firstName, p.lastName].filter(Boolean).join(" ");
  const parts = full.split(/\s+/).filter(Boolean);
  const first = p.firstName?.trim() || parts[0] || "";
  const lastRaw = p.lastName?.trim() || (parts.length > 1 ? parts[parts.length - 1] : "");
  const last = /•/.test(lastRaw) ? "" : lastRaw;
  return { full, first, last };
}

/* ---------- finders ---------- */
async function hunterFind(p: Person, key: string): Promise<EmailResult> {
  const n = names(p);
  const url = new URL("https://api.hunter.io/v2/email-finder");
  if (p.domain) url.searchParams.set("domain", p.domain); else url.searchParams.set("company", p.company ?? "");
  if (n.first && n.last) { url.searchParams.set("first_name", n.first); url.searchParams.set("last_name", n.last); } else url.searchParams.set("full_name", n.full);
  const res = await fetch(url, { headers: { "X-API-KEY": key }, cache: "no-store" });
  if (res.status === 429 || res.status === 402) throw new QuotaError("Hunter quota reached");
  if (res.status === 401) throw new Error("Hunter rejected the key");
  if (!res.ok) throw new Error(`Hunter ${res.status}`);
  const d = (await res.json()) as { data?: { email?: string | null; score?: number; verification?: { status?: string | null } | null } };
  const email = d.data?.email ?? null;
  const v = d.data?.verification?.status;
  return { email, status: !email ? "unknown" : v === "valid" ? "valid" : v === "accept_all" ? "risky_catch_all" : "unknown", provider: "hunter", score: d.data?.score ?? null };
}

async function anymailfinderFind(p: Person, key: string): Promise<EmailResult> {
  const n = names(p);
  const body: Record<string, string> = {};
  if (p.domain) body.domain = p.domain; else if (p.company) body.company_name = p.company;
  if (n.first && n.last) { body.first_name = n.first; body.last_name = n.last; } else body.full_name = n.full;
  if (p.linkedinUrl) body.linkedin_url = p.linkedinUrl;
  const res = await fetch("https://api.anymailfinder.com/v5.1/find-email/person", { method: "POST", headers: { Authorization: key, "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store", signal: AbortSignal.timeout(120_000) });
  if (res.status === 402) throw new QuotaError("Anymailfinder credits used up");
  if (res.status === 401) throw new Error("Anymailfinder rejected the key");
  if (!res.ok) throw new Error(`Anymailfinder ${res.status}`);
  const d = (await res.json()) as { email?: string | null; email_status?: string; valid_email?: string | null; credits_charged?: number };
  const email = d.valid_email ?? d.email ?? null;
  return { email, status: email && d.email_status === "valid" ? "valid" : email ? "unknown" : "unknown", provider: "anymailfinder", score: null };
}

async function prospeoFind(p: Person, key: string): Promise<EmailResult> {
  const n = names(p);
  const data: Record<string, string> = {};
  if (n.first && n.last) { data.first_name = n.first; data.last_name = n.last; } else data.full_name = n.full;
  if (p.domain) data.company_website = p.domain;
  if (p.company) data.company_name = p.company;
  if (p.linkedinUrl) data.linkedin_url = p.linkedinUrl;
  const res = await fetch("https://api.prospeo.io/enrich-person", { method: "POST", headers: { "X-KEY": key, "Content-Type": "application/json" }, body: JSON.stringify({ only_verified_email: false, data }), cache: "no-store" });
  if (res.status === 402 || res.status === 429) throw new QuotaError("Prospeo credits used up");
  if (res.status === 401 || res.status === 403) throw new Error("Prospeo rejected the key");
  if (res.status === 404) return { email: null, status: "unknown", provider: "prospeo", score: null };
  if (!res.ok) throw new Error(`Prospeo ${res.status}`);
  const d = (await res.json()) as { person?: { email?: { email?: string | null; status?: string } } };
  const email = d.person?.email?.email ?? null;
  const st = d.person?.email?.status?.toUpperCase();
  return { email, status: !email ? "unknown" : st === "VERIFIED" ? "valid" : st?.includes("CATCH") ? "risky_catch_all" : "unknown", provider: "prospeo", score: null };
}

async function apolloFind(p: Person, key: string): Promise<EmailResult> {
  const n = names(p);
  const url = new URL("https://api.apollo.io/api/v1/people/match");
  if (p.apolloId) url.searchParams.set("id", p.apolloId);
  else { if (n.first) url.searchParams.set("first_name", n.first); if (n.last) url.searchParams.set("last_name", n.last); if (p.domain) url.searchParams.set("domain", p.domain); else if (p.company) url.searchParams.set("organization_name", p.company); }
  url.searchParams.set("reveal_personal_emails", "false");
  const res = await fetch(url, { method: "POST", headers: { "x-api-key": key, "Content-Type": "application/json" }, cache: "no-store" });
  if (res.status === 429 || res.status === 402) throw new QuotaError("Apollo credits used up");
  if (res.status === 401 || res.status === 403) throw new Error("Apollo rejected the key");
  if (!res.ok) throw new Error(`Apollo ${res.status}`);
  const d = (await res.json()) as { person?: { email?: string | null; email_status?: string | null } };
  const email = d.person?.email ?? null;
  return { email, status: !email ? "unknown" : d.person?.email_status === "verified" ? "valid" : "unknown", provider: "apollo", score: null };
}

/* ---------- verifiers ---------- */
async function reoonVerify(email: string, key: string): Promise<EmailStatus> {
  const url = `https://emailverifier.reoon.com/api/v1/verify?email=${encodeURIComponent(email)}&key=${encodeURIComponent(key)}&mode=power`;
  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(60_000) });
  if (res.status === 429 || res.status === 402) throw new QuotaError("Reoon quota reached");
  if (!res.ok) throw new Error(`Reoon ${res.status}`);
  const d = (await res.json()) as { status?: string; is_catch_all?: boolean };
  switch (d.status) {
    case "safe": return "valid";
    case "catch_all": return "risky_catch_all";
    case "role_account": return "role_based";
    case "disposable": return "disposable";
    case "invalid": case "disabled": case "spamtrap": return "invalid";
    default: return "unknown";
  }
}
async function hunterVerify(email: string, key: string): Promise<EmailStatus> {
  const url = `https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}`;
  for (let i = 0; i < 3; i++) {
    const res = await fetch(url, { headers: { "X-API-KEY": key }, cache: "no-store" });
    if (res.status === 202) { await new Promise((r) => setTimeout(r, 3000)); continue; }
    if (res.status === 429 || res.status === 402) throw new QuotaError("Hunter verifications used up");
    if (!res.ok) throw new Error(`Hunter verifier ${res.status}`);
    const d = (await res.json()) as { data?: { status?: string } };
    switch (d.data?.status) { case "valid": return "valid"; case "accept_all": return "risky_catch_all"; case "invalid": return "invalid"; case "disposable": return "disposable"; default: return "unknown"; }
  }
  return "unknown";
}

/* ---------- the waterfall ---------- */
async function order(settingKey: string, fallback: readonly string[]) {
  const o = await getJsonSetting<string[]>(settingKey);
  return Array.isArray(o) && o.length ? o : [...fallback];
}

export async function findEmailWaterfall(p: Person, log: string[] = []): Promise<EmailResult> {
  if (await mockMode()) {
    const n = names(p);
    const dom = p.domain ?? `${(p.company ?? "example").toLowerCase().replace(/[^a-z]/g, "")}.example`;
    return { email: `${(n.first || "hello").toLowerCase()}@${dom}`, status: "valid", provider: "mock", score: 92 };
  }
  const finders: Record<string, (p: Person, key: string) => Promise<EmailResult>> = { hunter: hunterFind, anymailfinder: anymailfinderFind, prospeo: prospeoFind, apollo: apolloFind };
  for (const provider of await order("email_finder_order", FINDER_ORDER_DEFAULT)) {
    const fn = finders[provider]; if (!fn) continue;
    const key = await getKey(KEY_FOR[provider]);
    if (!key) { log.push(`${provider}: no key`); continue; }
    if (await isExhausted(provider)) { log.push(`${provider}: monthly limit reached`); continue; }
    if (provider === "apollo" && !p.apolloId && !p.domain) { log.push("apollo: needs a domain"); continue; }
    try {
      const r = await fn(p, key);
      await recordCall(provider, "find_email", Boolean(r.email), provider === "hunter" ? true : Boolean(r.email), r.email ? "found" : "not found");
      if (r.email) { log.push(`${provider}: found`); return r; }
      log.push(`${provider}: not found`);
    } catch (e) {
      if (e instanceof QuotaError) { await markExhausted(provider); await recordCall(provider, "find_email", false, false, "quota"); log.push(`${provider}: quota reached, switching`); continue; }
      log.push(`${provider}: ${e instanceof Error ? e.message : "error"}`);
    }
  }
  return { email: null, status: "unknown", provider: "none", score: null };
}

export async function verifyEmailWaterfall(email: string, log: string[] = []): Promise<EmailStatus | null> {
  if (await mockMode()) return "valid";
  const verifiers: Record<string, (e: string, key: string) => Promise<EmailStatus>> = { reoon: reoonVerify, hunter: hunterVerify };
  for (const provider of await order("email_verifier_order", VERIFIER_ORDER_DEFAULT)) {
    const fn = verifiers[provider]; if (!fn) continue;
    const key = await getKey(KEY_FOR[provider]);
    if (!key) continue;
    if (await isExhausted(provider)) { log.push(`${provider} verify: limit reached`); continue; }
    try {
      const s = await fn(email, key);
      await recordCall(provider, "verify_email", true, true, s);
      log.push(`${provider} verify: ${s}`);
      return s;
    } catch (e) {
      if (e instanceof QuotaError) { await markExhausted(provider); log.push(`${provider} verify: quota reached`); continue; }
      log.push(`${provider} verify: ${e instanceof Error ? e.message : "error"}`);
    }
  }
  return null;
}

/** Find, then verify if the finder didn't already say "valid". */
export async function findAndVerify(p: Person): Promise<EmailResult & { log: string[] }> {
  const log: string[] = [];
  const r = await findEmailWaterfall(p, log);
  if (r.email && r.status !== "valid") {
    const v = await verifyEmailWaterfall(r.email, log);
    if (v) r.status = v;
  }
  return { ...r, log };
}

const sha = (s: string) => createHash("sha256").update(s.trim().toLowerCase()).digest("hex");

export async function findEmailForCandidate(candidateId: string) {
  const [c] = await db.select().from(candidates).where(eq(candidates.id, candidateId));
  if (!c) throw new Error("Candidate not found");
  if (!c.fullName) throw new Error("This row is a company only. Find the person first.");
  const r = await findAndVerify({ fullName: c.fullName, firstName: c.firstName, domain: c.domain, company: c.companyName, linkedinUrl: c.linkedinUrl, apolloId: c.source === "apollo" ? c.externalId : null });
  const [u] = await db.update(candidates).set({ email: r.email ?? c.email, emailStatus: r.email ? r.status : c.emailStatus, signal: c.signal }).where(eq(candidates.id, candidateId)).returning();
  return { row: u, result: r };
}

export async function findEmailForPerson(personId: string) {
  const [p] = await db.select().from(people).where(eq(people.id, personId));
  if (!p) throw new Error("Lead not found");
  const co = p.companyId ? (await db.select().from(companies).where(eq(companies.id, p.companyId)))[0] : null;
  const r = await findAndVerify({ firstName: p.firstName, lastName: p.lastName, fullName: p.fullName, domain: co?.domain, company: co?.name, linkedinUrl: p.linkedinUrl });
  const [u] = await db.update(people).set({ email: r.email ?? p.email, emailHash: r.email ? sha(r.email) : p.emailHash, emailStatus: r.email ? r.status : p.emailStatus }).where(eq(people.id, personId)).returning();
  return { row: u, result: r };
}
