import type { Usage } from "@anthropic-ai/sdk/resources/messages";
import { PRICES, WEB_SEARCH_PER_1K, type ModelId } from "./models";

export function costFromUsage(model: ModelId, usage: Usage | undefined | null) {
  if (!usage) return { usd: 0, input: 0, output: 0, cacheRead: 0, cacheWrite: 0, searches: 0 };
  const p = PRICES[model];
  const input = usage.input_tokens ?? 0;
  const output = usage.output_tokens ?? 0;
  const cacheRead = usage.cache_read_input_tokens ?? 0;
  const cacheWrite = usage.cache_creation_input_tokens ?? 0;
  const searches = usage.server_tool_use?.web_search_requests ?? 0;
  const total = input + cacheRead + cacheWrite;
  const mult = p.longContextThreshold && total > p.longContextThreshold ? (p.longContextMultiplier ?? 1) : 1;
  const per = (x: number) => x / 1_000_000;
  const usd =
    mult * (input * per(p.input) + output * per(p.output) + cacheRead * per(p.cacheRead) + cacheWrite * per(p.cacheWrite5m)) +
    searches * (WEB_SEARCH_PER_1K / 1000);
  return { usd, input, output, cacheRead, cacheWrite, searches };
}
