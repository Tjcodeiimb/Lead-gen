/**
 * Deterministic scoring. The model chooses levels; this code computes points,
 * total, gates and tier (docs/research/02 §4.3-4.4). Never let a model do this.
 */
import type { QualifierOutput } from "./schemas/qualify";

export const RUBRIC_VERSION = "2026-10-20.v1";

export const WEIGHTS: Record<string, number> = {
  C1_firmographic_fit: 20, C2_expansion_intent: 20, C3_buyer_role: 15, C4_timing: 10,
  C5_budget_proxies: 10, C6_consumer_relevance: 10, C7_finops_need: 10, C8_reachability: 5,
};
const LEVEL_MULT: Record<string, number> = { L0: 0, L1: 0.25, L2: 0.5, L3: 0.75, L4: 1, UNKNOWN: 0 };
const LEVEL_RANK: Record<string, number> = { L0: 0, L1: 1, L2: 2, L3: 3, L4: 4, UNKNOWN: -1 };

export type Scored = {
  levels: Record<string, string>;
  points: Record<string, number>;
  total: number;
  tier: "A" | "B" | "C" | "DQ" | "NEEDS_RESEARCH";
  gates: Record<string, boolean>;
  escalate: boolean;
  escalationReason: string | null;
  primaryOffer: string | null;
};

export function scoreQualification(q: QualifierOutput, validEvidenceIds: Set<string>): Scored {
  const levels: Record<string, string> = {};
  const points: Record<string, number> = {};

  for (const c of q.criteria) {
    let level = c.level;
    // Verifier rule 1: every cited evidence id must exist; otherwise the criterion is UNKNOWN.
    if (level !== "L0" && level !== "UNKNOWN" && c.evidence_ids.some((id) => !validEvidenceIds.has(id))) level = "UNKNOWN";
    // Verifier rule 2: L1+ must cite evidence; user-input-only evidence caps at L2.
    if (level !== "L0" && level !== "UNKNOWN") {
      if (c.evidence_ids.length === 0) level = "UNKNOWN";
      else if (c.evidence_ids.every((id) => id.startsWith("INPUT:")) && LEVEL_RANK[level] > 2) level = "L2";
    }
    levels[c.criterion] = level;
    points[c.criterion] = Math.round(WEIGHTS[c.criterion] * LEVEL_MULT[level] * 100) / 100;
  }
  for (const k of Object.keys(WEIGHTS)) if (!(k in levels)) { levels[k] = "UNKNOWN"; points[k] = 0; }

  const total = Math.round(Object.values(points).reduce((a, b) => a + b, 0) * 10) / 10;
  const unknownCore = ["C1_firmographic_fit", "C2_expansion_intent", "C3_buyer_role", "C4_timing", "C5_budget_proxies"].filter((k) => levels[k] === "UNKNOWN").length;

  const gates = {
    knockout: q.knockouts.length === 0,
    entity_confirmed: q.entity_check.company_match === "confirmed",
    a_gate_c3: LEVEL_RANK[levels.C3_buyer_role] >= 3,
    a_gate_trigger: LEVEL_RANK[levels.C2_expansion_intent] >= 3 || LEVEL_RANK[levels.C4_timing] >= 3,
    a_gate_confidence: q.confidence !== "low",
  };

  let tier: Scored["tier"];
  if (!gates.knockout) tier = "DQ";
  else if (unknownCore >= 3 || q.entity_check.company_match === "ambiguous" || q.entity_check.company_match === "mismatch") tier = "NEEDS_RESEARCH";
  else if (total < 35) tier = "DQ";
  else if (total >= 75 && gates.entity_confirmed && gates.a_gate_c3 && gates.a_gate_trigger && gates.a_gate_confidence) tier = "A";
  else if (total >= 55) tier = "B";
  else tier = "C";

  let escalationReason: string | null = null;
  if ((total >= 70 && total <= 79) || (total >= 50 && total <= 59)) escalationReason = "score_on_tier_boundary";
  else if (q.tier_opinion !== tier) escalationReason = `model_opinion_${q.tier_opinion}_vs_computed_${tier}`;
  else if (q.confidence === "low" && total >= 50) escalationReason = "low_confidence_high_score";
  else if (q.review_flags.includes("strategic_account")) escalationReason = "strategic_account";

  const high = q.offer_fit.find((o) => o.fit === "high");
  return { levels, points, total, tier, gates, escalate: escalationReason !== null, escalationReason, primaryOffer: high?.offer ?? null };
}
