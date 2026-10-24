import { env, isConfigured } from "@/lib/env";

export async function GET() {
  return Response.json({
    ok: true,
    configured: isConfigured(),
    claudeMode: env.claudeMode,
    supabaseProject: (() => { try { return new URL(env.supabaseUrl).hostname.replace(".supabase.co", ""); } catch { return ""; } })(),
    allowlistCount: env.allowedEmails.length,
    time: new Date().toISOString(),
  });
}
