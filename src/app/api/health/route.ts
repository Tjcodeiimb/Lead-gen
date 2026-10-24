import { sql } from "drizzle-orm";
import { env, isConfigured } from "@/lib/env";
import { ensureMigrated } from "@/db/migrate";

export const dynamic = "force-dynamic";

/** Self-diagnosis used by the error screen. Safe to share: no secrets. */
export async function GET() {
  const supabaseProject = (() => { try { return new URL(env.supabaseUrl).hostname.replace(".supabase.co", ""); } catch { return ""; } })();
  const checks: Record<string, string> = {
    supabase_url: env.supabaseUrl ? "set" : "MISSING",
    supabase_key: env.supabaseAnonKey ? "set" : "MISSING",
    database_url: env.databaseUrl ? "set" : "MISSING",
    allowed_emails: env.allowedEmails.length ? `${env.allowedEmails.length} address(es)` : "EMPTY (nobody can sign in)",
    claude: env.claudeMode,
  };
  let db = "not checked";
  let migrations = "not checked";
  if (env.databaseUrl) {
    const m = await ensureMigrated();
    migrations = m.ok ? (m.applied ? "applied new migrations" : "up to date") : `FAILED: ${m.error}`;
    try {
      const { db: client } = await import("@/db/client");
      const r = await client.execute(sql`select count(*)::int as n from information_schema.tables where table_schema = 'public'`);
      db = `connected, ${(r as unknown as { n: number }[])[0]?.n ?? "?"} tables`;
    } catch (e) {
      db = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
  const ok = isConfigured() && db.startsWith("connected") && !migrations.startsWith("FAILED");
  return Response.json({ ok, supabaseProject, checks, db, migrations, time: new Date().toISOString() }, { status: ok ? 200 : 503 });
}
