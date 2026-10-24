import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { ensureMigrated } from "@/db/migrate";
import { loadSettings } from "@/lib/settings-cache";
import { createSupabaseServer } from "@/lib/supabase/server";

declare global {
  var __upforgeBootAt: number | undefined;
  var __upforgeRequests: number | undefined;
}

export type Diag = {
  region: string; instanceAgeSec: number; requestsOnInstance: number; coldStart: boolean;
  timings: { label: string; ms: number; note?: string }[];
  dbHost: string;
  totalMs: number;
};

const time = async (label: string, fn: () => Promise<string | void>) => { const t = Date.now(); let note: string | undefined; try { note = (await fn()) || undefined; } catch (e) { note = `FAILED: ${e instanceof Error ? e.message : e}`; } return { label, ms: Date.now() - t, note }; };

/** Measures, from the server's own point of view, where a page's time goes. */
export async function runDiagnostics(): Promise<Diag> {
  const t0 = Date.now();
  if (!globalThis.__upforgeBootAt) globalThis.__upforgeBootAt = Date.now();
  globalThis.__upforgeRequests = (globalThis.__upforgeRequests ?? 0) + 1;
  const timings: Diag["timings"] = [];
  timings.push(await time("Database round trip (select 1)", async () => { await db.execute(sql`select 1`); }));
  timings.push(await time("Database round trip, again (warm)", async () => { await db.execute(sql`select 1`); }));
  timings.push(await time("Schema check (migrations)", async () => { const m = await ensureMigrated(); return m.ok ? (m.applied ? "applied" : "up to date") : m.error; }));
  timings.push(await time("Read settings table", async () => { const m = await loadSettings(); return `${m.size} keys`; }));
  timings.push(await time("Sign-in check (Supabase getClaims)", async () => { const s = await createSupabaseServer(); const { data } = await s.auth.getClaims(); return data?.claims?.email ? "verified" : "no session"; }));
  timings.push(await time("Count leads (typical page query)", async () => { const r = await db.execute(sql`select count(*)::int as n from people`); return `${(r as unknown as { n: number }[])[0]?.n} rows`; }));
  let dbHost = "";
  try { dbHost = (process.env.DATABASE_URL || process.env.POSTGRES_URL || "").split("@")[1]?.split("/")[0] ?? ""; } catch {}
  return {
    region: process.env.VERCEL_REGION ?? (process.env.VERCEL ? "unknown" : "local"),
    instanceAgeSec: Math.round((Date.now() - globalThis.__upforgeBootAt) / 1000),
    requestsOnInstance: globalThis.__upforgeRequests,
    coldStart: globalThis.__upforgeRequests === 1,
    timings, dbHost, totalMs: Date.now() - t0,
  };
}
