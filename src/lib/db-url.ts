/**
 * Picks the database address from whichever variable is set and cleans it for postgres.js.
 *
 * - Our own name is DATABASE_URL. The Vercel + Supabase integration sets POSTGRES_URL (pooled) instead.
 * - The integration's pooled address carries extra query parameters (supa=..., pgbouncer=true) that
 *   Supabase's pooler rejects as unknown startup parameters when a driver forwards them. We keep only sslmode.
 */
export function pickDatabaseUrl(e: Record<string, string | undefined> = process.env): string {
  return sanitizeDatabaseUrl(e.DATABASE_URL || e.POSTGRES_URL || e.POSTGRES_PRISMA_URL || "");
}

export function sanitizeDatabaseUrl(raw: string): string {
  if (!raw) return "";
  const q = raw.indexOf("?");
  if (q === -1) return raw;
  const base = raw.slice(0, q);
  const keep = raw.slice(q + 1).split("&").filter((p) => /^sslmode=/i.test(p));
  return keep.length ? `${base}?${keep.join("&")}` : base;
}
