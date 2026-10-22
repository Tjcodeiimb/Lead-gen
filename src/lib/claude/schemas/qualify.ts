import { z } from "zod";

export const CRITERIA = ["C1_firmographic_fit", "C2_expansion_intent", "C3_buyer_role", "C4_timing", "C5_budget_proxies", "C6_consumer_relevance", "C7_finops_need", "C8_reachability"] as const;
export const LEVELS = ["L0", "L1", "L2", "L3", "L4", "UNKNOWN"] as const;

export const QualifierSchema = z.object({
  entity_check: z.object({
    company_match: z.enum(["confirmed", "probable", "ambiguous", "mismatch"]),
    person_match: z.enum(["confirmed_current_role", "probable", "not_verified", "left_company", "mismatch"]),
    note: z.string(),
  }),
  knockouts: z.array(z.object({
    code: z.enum(["competitor", "government_body", "sanctions_risk", "too_small", "person_left_company", "suppressed_contact", "out_of_geography", "not_a_buyer", "insolvency"]),
    evidence_ids: z.array(z.string()),
  })),
  criteria: z.array(z.object({
    criterion: z.enum(CRITERIA),
    level: z.enum(LEVELS),
    evidence_ids: z.array(z.string()),
    rationale: z.string(),
  })),
  offer_fit: z.array(z.object({
    offer: z.enum(["market_entry", "consumer_psychology", "ops_finance_modelling"]),
    fit: z.enum(["high", "medium", "low", "none"]),
    why: z.string(),
  })),
  tier_opinion: z.enum(["A", "B", "C", "DQ", "NEEDS_RESEARCH"]),
  confidence: z.enum(["high", "medium", "low"]),
  confidence_reason: z.string(),
  unknowns: z.array(z.string()),
  review_flags: z.array(z.enum(["conflicting_evidence", "stale_evidence", "person_role_unverified", "possible_wrong_entity", "thin_evidence", "user_input_only", "sensitive_inference_avoided", "possible_prompt_injection_in_source", "strategic_account"])),
  personalization_hooks: z.array(z.object({ hook: z.string(), evidence_id: z.string() })),
  reviewer_summary: z.string(),
  next_action: z.enum(["approve_for_offer_crafting", "targeted_research", "nurture", "monitor", "archive"]),
});
export type QualifierOutput = z.infer<typeof QualifierSchema>;
