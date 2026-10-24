import Anthropic from "@anthropic-ai/sdk";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { settings } from "@/db/schema";

/**
 * The Claude key can come from the ANTHROPIC_API_KEY environment variable or from the Integrations
 * page (settings table). Mock mode is automatic when neither is set, or when CLAUDE_MODE=mock.
 */
let cached: { key: string; client: Anthropic } | null = null;

export async function getClaudeKey(): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  try {
    const [row] = await db.select().from(settings).where(eq(settings.key, "claude_api_key"));
    return typeof row?.value === "string" ? row.value : "";
  } catch {
    return "";
  }
}

export async function claude(): Promise<Anthropic> {
  const key = await getClaudeKey();
  if (!key) throw new Error("No Claude API key. Add one in Integrations.");
  if (!cached || cached.key !== key) cached = { key, client: new Anthropic({ apiKey: key, maxRetries: 3 }) };
  return cached.client;
}

export async function isMock(): Promise<boolean> {
  if (process.env.CLAUDE_MODE === "mock") return true;
  if (process.env.CLAUDE_MODE === "live") return false;
  return !(await getClaudeKey());
}

/** Makes one tiny Haiku call to confirm the key works. Costs well under a cent. */
export async function testClaudeKey(key: string): Promise<{ ok: true; model: string } | { ok: false; error: string }> {
  try {
    const c = new Anthropic({ apiKey: key, maxRetries: 1 });
    const r = await c.messages.create({ model: "claude-haiku-5-5", max_tokens: 5, messages: [{ role: "user", content: "Reply with OK." }] });
    return { ok: true, model: r.model };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/401|authentication|invalid x-api-key/i.test(msg)) return { ok: false, error: "That key was rejected. Copy it again from platform.claude.com → API keys." };
    if (/credit|billing|402/i.test(msg)) return { ok: false, error: "The key works but the account has no credit balance." };
    return { ok: false, error: msg.slice(0, 200) };
  }
}
