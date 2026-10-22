import { z } from "zod";

/** Structured-output rules: every field required, no min/max constraints, enums for categories. */
export const CampaignBriefSchema = z.object({
  positioning: z.string().describe("One paragraph: who this campaign targets, what they are trying to do, why UpForge is relevant now."),
  icp: z.object({
    summary: z.string(),
    must_haves: z.array(z.string()),
    exclusions: z.array(z.string()),
    buyer_titles: z.array(z.string()),
  }),
  signals: z.array(z.object({
    type: z.string().describe("e.g. job_post_market_lead, new_subsidiary, funding, expansion_press, marketplace_listing"),
    why: z.string(),
    detection: z.string().describe("Concrete, free-first way to detect it (registry, job API, news query)."),
  })),
  subject_lines: z.array(z.string()).describe("10 subject lines, 1-6 words, lowercase, no clickbait."),
  sequence: z.array(z.object({
    step: z.number(),
    day: z.number(),
    channel: z.enum(["email", "linkedin"]),
    purpose: z.string(),
    body: z.string().describe("Template with {{placeholders}} for first_name, company, signal, insight. Email bodies under 80 words."),
  })),
  linkedin_note: z.string().describe("Under 300 characters, no pitch, no price."),
  objections: z.array(z.object({ objection: z.string(), response: z.string() })),
  risks: z.array(z.string()),
});
export type CampaignBriefOutput = z.infer<typeof CampaignBriefSchema>;
