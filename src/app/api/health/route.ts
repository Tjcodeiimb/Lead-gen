import { env, isConfigured } from "@/lib/env";

export async function GET() {
  return Response.json({
    ok: true,
    configured: isConfigured(),
    claudeMode: env.claudeMode,
    time: new Date().toISOString(),
  });
}
