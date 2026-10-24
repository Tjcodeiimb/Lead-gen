import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { providerCalls, settings } from "@/db/schema";
import { invalidateSettings, loadSettings, settingString } from "@/lib/settings-cache";

/**
 * Third-party keys live in the settings table (single-user app) so they can be entered in the
 * Integrations screen instead of Vercel. Environment variables still win if set.
 * `freeMonthly` is the free-plan allowance used by the auto-switch meters; edit in Settings if your plan differs.
 */
export type IntegrationDef = {
  key: string; env: string; label: string; group: "claude" | "email_finder" | "email_verifier" | "lead_source" | "sending";
  help: string; link: string; steps: string[]; freeMonthly?: number; unit?: string;
};

export const INTEGRATIONS = [
  {
    key: "claude_api_key", env: "ANTHROPIC_API_KEY", label: "Claude API key", group: "claude",
    help: "Powers research, scoring and writing. Spends from your Claude credit balance.", link: "https://platform.claude.com/settings/keys",
    steps: [
      "Go to platform.claude.com and sign in with the account that holds your credits.",
      "Open Settings → Workspaces → Create workspace. Name it upforge-prod. Set a monthly spend limit (for example $100).",
      "Open API keys → Create key. Choose the upforge-prod workspace. Copy the key; it starts with sk-ant- and is shown once.",
      "Paste it here and click Test. The test costs under a cent.",
      "If you are on a Max plan: claude.ai → Settings → Billing → API credits → Link organization, so your monthly Max credits are used first.",
    ],
  },
  {
    key: "hunter_api_key", env: "HUNTER_API_KEY", label: "Hunter", group: "email_finder",
    help: "Finds and verifies work emails from a name and company website.", link: "https://hunter.io/api-keys", freeMonthly: 25, unit: "finds",
    steps: ["Sign up free at hunter.io.", "Open hunter.io/api-keys and copy the key.", "Paste it here. Free plan: 25 finds and 50 verifications a month."],
  },
  {
    key: "anymailfinder_api_key", env: "ANYMAILFINDER_API_KEY", label: "Anymailfinder", group: "email_finder",
    help: "Only charges when it finds a valid email. Good second step.", link: "https://anymailfinder.com", freeMonthly: 15, unit: "finds",
    steps: ["Sign up at anymailfinder.com (free trial credits).", "Open Settings → API and copy the key.", "Paste it here. Not-found results are free."],
  },
  {
    key: "prospeo_api_key", env: "PROSPEO_API_KEY", label: "Prospeo", group: "email_finder",
    help: "Enriches a person with a verified email; no charge when nothing is found.", link: "https://prospeo.io", freeMonthly: 75, unit: "credits",
    steps: ["Sign up free at prospeo.io.", "Open Settings → API Keys and create a key.", "Paste it here. Free plan gives monthly credits; 1 credit per email found."],
  },
  {
    key: "apollo_api_key", env: "APOLLO_API_KEY", label: "Apollo", group: "lead_source",
    help: "Search people by title, location and company size (free). Reveal emails for 1 credit each.", link: "https://app.apollo.io/#/settings/integrations/api", freeMonthly: 75, unit: "reveals",
    steps: ["Sign up free at apollo.io.", "Open Settings → Integrations → API → Create new key. Tick 'Master API key' so search and reveal both work.", "Paste it here. Searching is free; each reveal costs 1 of your 75 monthly credits."],
  },
  {
    key: "reoon_api_key", env: "REOON_API_KEY", label: "Reoon verifier", group: "email_verifier",
    help: "Checks an address is deliverable before you send. Free daily allowance.", link: "https://www.reoon.com/email-verifier/", freeMonthly: 500, unit: "checks",
    steps: ["Sign up at reoon.com/email-verifier.", "Open Dashboard → API and copy the key.", "Paste it here. Free plan: about 20 checks a day."],
  },
  {
    key: "theirstack_api_key", env: "THEIRSTACK_API_KEY", label: "TheirStack jobs", group: "lead_source",
    help: "Finds companies hiring a 'Country Manager' or similar in your target market.", link: "https://app.theirstack.com/settings/api-keys", freeMonthly: 200, unit: "credits",
    steps: ["Sign up free at theirstack.com.", "Open Settings → API keys → Create. Copy it.", "Paste it here. 1 credit per job post returned; the signals finder asks for 20 at a time."],
  },
  {
    key: "companies_house_api_key", env: "COMPANIES_HOUSE_API_KEY", label: "Companies House (UK)", group: "lead_source",
    help: "New UK company registrations. Free, no limit that matters.", link: "https://developer.company-information.service.gov.uk/manage-applications",
    steps: ["Register at developer.company-information.service.gov.uk.", "Create an application (type: REST API). Copy the key shown.", "Paste it here. Used only when a campaign targets the UK."],
  },
  {
    key: "google_client_id", env: "GOOGLE_CLIENT_ID", label: "Google OAuth client ID", group: "sending",
    help: "For Gmail drafts.", link: "https://console.cloud.google.com/apis/credentials",
    steps: ["console.cloud.google.com → New project 'upforge-os'.", "APIs & Services → Library → enable Gmail API.", "OAuth consent screen → Internal (Workspace) or External + add yourself as a test user.", "Credentials → Create → OAuth client ID → Web application. Add redirect URI: your app address + /api/google/callback.", "Copy Client ID and Client secret into the two boxes here, then click Connect Google."],
  },
  { key: "google_client_secret", env: "GOOGLE_CLIENT_SECRET", label: "Google OAuth client secret", group: "sending", help: "From the same OAuth client.", link: "https://console.cloud.google.com/apis/credentials", steps: [] },
] as const satisfies readonly IntegrationDef[];
export type IntegrationKey = (typeof INTEGRATIONS)[number]["key"];

/** Provider id used in provider_calls (the key without the _api_key suffix). */
export const providerOf = (key: IntegrationKey) => key.replace(/_api_key$/, "");

export async function getKey(key: IntegrationKey): Promise<string> {
  const def = INTEGRATIONS.find((i) => i.key === key)!;
  const fromEnv = process.env[def.env];
  if (fromEnv) return fromEnv;
  return settingString(key);
}

export type KeyStatus = { set: boolean; fromEnv: boolean; last4: string };
export async function getAllKeyStatus(): Promise<Record<IntegrationKey, KeyStatus>> {
  const map = Object.fromEntries(await loadSettings());
  const out = {} as Record<IntegrationKey, KeyStatus>;
  for (const i of INTEGRATIONS) {
    const v = process.env[i.env] || (typeof map[i.key] === "string" ? (map[i.key] as string) : "");
    out[i.key] = { set: Boolean(v), fromEnv: Boolean(process.env[i.env]), last4: v ? v.slice(-4) : "" };
  }
  return out;
}

export async function getJsonSetting<T>(key: string): Promise<T | null> {
  return ((await loadSettings()).get(key) as T | undefined) ?? null;
}
export async function setJsonSetting(key: string, value: unknown) {
  await db.insert(settings).values({ key, value: value as object }).onConflictDoUpdate({ target: settings.key, set: { value: value as object } });
  invalidateSettings();
}

/* ---------- usage meters and auto-switch ---------- */
export function monthStart() { const d = new Date(); d.setUTCDate(1); d.setUTCHours(0, 0, 0, 0); return d; }
export const monthKey = () => new Date().toISOString().slice(0, 7);

export async function recordCall(provider: string, action: string, ok: boolean, charged = true, note?: string) {
  await db.insert(providerCalls).values({ provider, action, ok, charged, note: note ?? null });
}

export async function monthlyUsed(provider: string): Promise<number> {
  const [r] = await db.select({ n: sql<number>`count(*)` }).from(providerCalls).where(and(eq(providerCalls.provider, provider), eq(providerCalls.charged, true), gte(providerCalls.createdAt, monthStart())));
  return Number(r?.n ?? 0);
}

/** Limit for a provider: user override in settings (`limit:<provider>`) or the free-plan default. */
export async function monthlyLimit(provider: string): Promise<number | null> {
  const def = INTEGRATIONS.find((i) => providerOf(i.key) === provider);
  const override = await getJsonSetting<number>(`limit:${provider}`);
  if (typeof override === "number") return override;
  return def && "freeMonthly" in def && def.freeMonthly ? def.freeMonthly : null;
}

/** True when the provider has reported "quota exceeded" this month, or our meter says it's used up. */
export async function isExhausted(provider: string): Promise<boolean> {
  const flagged = await getJsonSetting<boolean>(`exhausted:${provider}:${monthKey()}`);
  if (flagged) return true;
  const limit = await monthlyLimit(provider);
  if (limit === null) return false;
  return (await monthlyUsed(provider)) >= limit;
}
export async function markExhausted(provider: string) { await setJsonSetting(`exhausted:${provider}:${monthKey()}`, true); }

export async function usageSummary() {
  const [rows, map] = await Promise.all([
    db.select({ provider: providerCalls.provider, n: sql<number>`count(*)` }).from(providerCalls)
      .where(and(eq(providerCalls.charged, true), gte(providerCalls.createdAt, monthStart()))).groupBy(providerCalls.provider),
    loadSettings(),
  ]);
  const used = new Map(rows.map((r) => [r.provider, Number(r.n)]));
  const out: Record<string, { used: number; limit: number | null; exhausted: boolean }> = {};
  for (const i of INTEGRATIONS) {
    const p = providerOf(i.key);
    if (p.startsWith("google")) continue;
    const override = map.get(`limit:${p}`);
    const limit = typeof override === "number" ? override : ("freeMonthly" in i && i.freeMonthly ? i.freeMonthly : null);
    const u = used.get(p) ?? 0;
    out[p] = { used: u, limit, exhausted: map.get(`exhausted:${p}:${monthKey()}`) === true || (limit !== null && u >= limit) };
  }
  return out;
}
