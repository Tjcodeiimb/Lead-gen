import { z } from "zod";

export const CopyPackageSchema = z.object({
  problem_hypothesis: z.string().describe("One or two sentences, falsifiable, humble."),
  email: z.object({
    subject: z.string().describe("Under 8 words, lowercase."),
    body: z.string().describe("Under 120 words. Opens with a cited fact. One ask. Ends with the opt-out line."),
  }),
  follow_up: z.object({
    subject: z.string(),
    body: z.string().describe("Written as a reply in the same thread, 2-3 lines, a new angle."),
  }),
  linkedin_note: z.string().describe("Under 300 characters. No pitch, no price."),
  facts_used: z.array(z.object({ fact: z.string(), evidence_id: z.string() })),
  risk_flags: z.array(z.string()),
});
export type CopyPackage = z.infer<typeof CopyPackageSchema>;
