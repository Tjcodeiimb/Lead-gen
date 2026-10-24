import { sql } from "drizzle-orm";
import { db } from "@/db/client";

export const dynamic = "force-dynamic";

/** Cheap keep-warm endpoint for an uptime pinger. Touches the database so the connection stays warm too. */
export async function GET() {
  const t = Date.now();
  let dbMs: number | null = null;
  try { await db.execute(sql`select 1`); dbMs = Date.now() - t; } catch { dbMs = null; }
  return Response.json({ ok: true, dbMs, at: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
}
