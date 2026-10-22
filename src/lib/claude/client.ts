import Anthropic from "@anthropic-ai/sdk";
import { env } from "@/lib/env";

let _client: Anthropic | null = null;

export function claude() {
  if (!_client) {
    if (!env.anthropicApiKey) throw new Error("ANTHROPIC_API_KEY is not set (and CLAUDE_MODE is live).");
    _client = new Anthropic({ apiKey: env.anthropicApiKey, maxRetries: 3 });
  }
  return _client;
}

export function isMock() {
  return env.claudeMode === "mock";
}
