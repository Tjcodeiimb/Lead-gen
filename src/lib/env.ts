/**
 * Central place to read environment variables. Everything is read lazily so the
 * login page can still render and explain setup when a value is missing.
 */
import { pickDatabaseUrl } from "@/lib/db-url";

export const env = {
  // The Vercel + Supabase integration uses different names; next.config.ts maps them onto NEXT_PUBLIC_*.
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "",
  supabaseAnonKey:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "",
  databaseUrl: pickDatabaseUrl(),
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
