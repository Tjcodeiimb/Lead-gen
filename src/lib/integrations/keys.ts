import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { settings } from "@/db/schema";

/**
 * Third-party keys live in the settings table (single-user app) so they can be entered in the
 * Settings screen instead of Vercel. Environment variables still win if set.
 */
export const INTEGRATIONS = [
  { key: "apollo_api_key", env: "APOLLO_API_KEY", label: "Apollo API key", help: "apollo.io → Settings → Integrations → API. Free plan: unlimited searches, 75 email reveals a month.", link: "https://app.apollo.io/#/settings/integrations/api" },
  { key: "hunter_api_key", env: "HUNTER_API_KEY", label: "Hunter API key", help: "hunter.io → API. Free plan: 25 searches and 50 verifications a month.", link: "https://hunter.io/api-keys" },
  { key: "theirstack_api_key", env: "THEIRSTACK_API_KEY", label: "TheirStack API key", help: "theirstack.com → Settings → API. Free plan: 200 credits a month (1 per job post).", link: "https://app.theirstack.com/settings/api-keys" },
  { key: "companies_house_api_key", env: "COMPANIES_HOUSE_API_KEY", label: "Companies House API key", help: "developer.company-information.service.gov.uk → Create an application → REST key. Free.", link: "https://developer.company-information.service.gov.uk/manage-applications" },
  { key: "google_client_id", env: "GOOGLE_CLIENT_ID", label: "Google OAuth client ID", help: "console.cloud.google.com → APIs & Services → Credentials → OAuth client (Web). Needed for Gmail drafts.", link: "https://console.cloud.google.com/apis/credentials" },
  { key: "google_client_secret", env: "GOOGLE_CLIENT_SECRET", label: "Google OAuth client secret", help: "From the same OAuth client.", link: "https://console.cloud.google.com/apis/credentials" },
] as const;
export type IntegrationKey = (typeof INTEGRATIONS)[number]["key"];

export async function getKey(key: IntegrationKey): Promise<string> {
  const def = INTEGRATIONS.find((i) => i.key === key)!;
  const fromEnv = process.env[def.env];
  if (fromEnv) return fromEnv;
  const [row] = await db.select().from(settings).where(eq(settings.key, key));
  return typeof row?.value === "string" ? row.value : "";
}

export async function getAllKeyStatus(): Promise<Record<IntegrationKey, { set: boolean; fromEnv: boolean; last4: string }>> {
  const rows = await db.select().from(settings);
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const out = {} as Record<IntegrationKey, { set: boolean; fromEnv: boolean; last4: string }>;
  for (const i of INTEGRATIONS) {
    const v = process.env[i.env] || (typeof map[i.key] === "string" ? (map[i.key] as string) : "");
    out[i.key] = { set: Boolean(v), fromEnv: Boolean(process.env[i.env]), last4: v ? v.slice(-4) : "" };
  }
  return out;
}

export async function getJsonSetting<T>(key: string): Promise<T | null> {
  const [row] = await db.select().from(settings).where(eq(settings.key, key));
  return (row?.value as T) ?? null;
}

export async function setJsonSetting(key: string, value: unknown) {
  await db.insert(settings).values({ key, value: value as object }).onConflictDoUpdate({ target: settings.key, set: { value: value as object } });
}
