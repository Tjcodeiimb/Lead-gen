import { z } from "zod";

export const CopyPackageSchema = z.object({
  problem_hypothesis: z.string().describe("One or two sentences, falsifiable, humble."),
  email: z.object({
    subject: z.string().describe("Two to five words, lowercase, about them. No colons or questions."),
    body: z.string().describe("At most five sentences before the sign-off: why them now, who I am, proof of work, one yes/no ask. Then sign-off and the opt-out line."),
  }),
  follow_up: z.object({
    subject: z.string(),
    body: z.string().describe("Day 4. Two or three sentences, written as a reply in the same thread, adding one new data point or a smaller ask."),
  }),
  follow_up_2: z.object({
    subject: z.string(),
    body: z.string().describe("Day 9. Two or three sentences as a reply: a permitted proof point or a relevant example with a number, and the same small ask."),
  }),
  close: z.object({
    subject: z.string(),
    body: z.string().describe("Day 18. One or two sentences. A gracious close that leaves the door open and offers the free pulse. No ask."),
  }),
  linkedin_note: z.string().describe("Under 300 characters. No pitch, no price."),
  facts_used: z.array(z.object({ fact: z.string(), evidence_id: z.string() })),
  risk_flags: z.array(z.string()),
});
export type CopyPackage = z.infer<typeof CopyPackageSchema>;
