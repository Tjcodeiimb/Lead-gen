/**
 * Central place to read environment variables. Everything is read lazily so the
 * login page can still render and explain setup when a value is missing.
 */
export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  allowedEmails: (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  claudeMode: (process.env.CLAUDE_MODE ?? (process.env.ANTHROPIC_API_KEY ? "live" : "mock")) as "live" | "mock",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
};

export function isConfigured() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey && env.databaseUrl);
}
