import fs from "node:fs";
import path from "node:path";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { pickDatabaseUrl } from "@/lib/db-url";
import { db } from "@/db/client";

declare global {
  var __upforgeMigrated: Promise<MigrateResult> | undefined;
}

export type MigrateResult = { ok: true; applied: boolean; ms: number } | { ok: false; error: string };

function journalCount(): number {
  try {
    const j = JSON.parse(fs.readFileSync(path.join(process.cwd(), "drizzle", "meta", "_journal.json"), "utf8")) as { entries?: unknown[] };
    return j.entries?.length ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Keeps the database schema current without a terminal command.
 * Fast path (one query on the shared connection): if the migrations table already lists every
 * migration shipped with this build, nothing else runs. Slow path only when something is missing:
 * open a dedicated connection, take an advisory lock, apply, release.
 */
export function ensureMigrated(): Promise<MigrateResult> {
  if (!globalThis.__upforgeMigrated) {
    globalThis.__upforgeMigrated = run()
      .then((r) => { if (r.ok) globalThis.__upforgeMigrated = Promise.resolve({ ...r, applied: false }); return r; })
      .catch((e) => { globalThis.__upforgeMigrated = undefined; return { ok: false as const, error: e instanceof Error ? e.message : String(e) }; });
  }
  return globalThis.__upforgeMigrated;
}

async function run(): Promise<MigrateResult> {
  const t0 = Date.now();
  const url = pickDatabaseUrl();
  if (!url) return { ok: false, error: "DATABASE_URL (or POSTGRES_URL) is not set." };
  const expected = journalCount();
  let have = -1;
  try {
    const r = await db.execute(sql`select count(*)::int as n from drizzle.__drizzle_migrations`);
    have = Number((r as unknown as { n: number }[])[0]?.n ?? 0);
  } catch {
    have = -1; // table missing: fresh database
  }
  if (have >= expected && expected > 0) return { ok: true, applied: false, ms: Date.now() - t0 };

  const conn = postgres(url, { max: 1, prepare: false, connect_timeout: 15, onnotice: () => {} });
  try {
    await conn`select pg_advisory_lock(727001)`;
    try {
      await migrate(drizzle(conn), { migrationsFolder: path.join(process.cwd(), "drizzle") });
      return { ok: true, applied: true, ms: Date.now() - t0 };
    } finally {
      await conn`select pg_advisory_unlock(727001)`;
    }
  } finally {
    await conn.end({ timeout: 5 });
  }
}
