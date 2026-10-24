import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { pickDatabaseUrl } from "@/lib/db-url";

declare global {
  var __upforgeMigrated: Promise<MigrateResult> | undefined;
}

export type MigrateResult = { ok: true; applied: boolean } | { ok: false; error: string };

/**
 * Applies any pending SQL migrations from /drizzle on first use, so the live site never needs a
 * terminal command. Safe to call from many requests at once: one Postgres advisory lock serialises
 * it across server instances, and a module-level promise serialises it within one.
 */
export function ensureMigrated(): Promise<MigrateResult> {
  if (!globalThis.__upforgeMigrated) {
    globalThis.__upforgeMigrated = run()
      .then((r) => { if (r.ok) globalThis.__upforgeMigrated = Promise.resolve({ ok: true, applied: false }); return r; })
      .catch((e) => { globalThis.__upforgeMigrated = undefined; return { ok: false as const, error: e instanceof Error ? e.message : String(e) }; });
  }
  return globalThis.__upforgeMigrated;
}

async function run(): Promise<MigrateResult> {
  const url = pickDatabaseUrl();
  if (!url) return { ok: false, error: "DATABASE_URL (or POSTGRES_URL) is not set." };
  const sql = postgres(url, { max: 1, prepare: false, connect_timeout: 15, onnotice: () => {} });
  try {
    await sql`select pg_advisory_lock(727001)`;
    try {
      const before = await countMigrations(sql);
      await migrate(drizzle(sql), { migrationsFolder: path.join(process.cwd(), "drizzle") });
      const after = await countMigrations(sql);
      return { ok: true, applied: after > before };
    } finally {
      await sql`select pg_advisory_unlock(727001)`;
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}

async function countMigrations(sql: postgres.Sql): Promise<number> {
  try {
    const rows = await sql`select count(*)::int as n from drizzle.__drizzle_migrations`;
    return Number(rows[0]?.n ?? 0);
  } catch {
    return 0;
  }
}
