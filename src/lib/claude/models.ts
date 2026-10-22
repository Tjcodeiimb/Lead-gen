/** Pinned model IDs. Change here only, then run evals (docs/research/05 §8.5). */
export const MODELS = {
  haiku: "claude-haiku-5-5",
  sonnet: "claude-sonnet-5-5",
  opus: "claude-opus-5-5",
} as const;
export type ModelId = (typeof MODELS)[keyof typeof MODELS];

export type Effort = "low" | "medium" | "high";

/** USD per million tokens (platform.claude.com pricing, Oct 2026). */
export const PRICES: Record<ModelId, { input: number; output: number; cacheWrite5m: number; cacheRead: number; longContextThreshold?: number; longContextMultiplier?: number }> = {
  "claude-haiku-5-5": { input: 0.1, output: 0.5, cacheWrite5m: 0.125, cacheRead: 0.01, longContextThreshold: 100_000, longContextMultiplier: 5 },
  "claude-sonnet-5-5": { input: 2, output: 10, cacheWrite5m: 2.5, cacheRead: 0.1 },
  "claude-opus-5-5": { input: 4, output: 20, cacheWrite5m: 5, cacheRead: 0.2 },
};
export const WEB_SEARCH_PER_1K = 10;
