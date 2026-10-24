import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { campaigns } from "@/db/schema";
import { runJob } from "@/lib/claude/runner";
import { MODELS } from "@/lib/claude/models";
import { CampaignBriefSchema } from "@/lib/claude/schemas/campaign";
import { campaignSystemPrompt, campaignUserPrompt, CAMPAIGN_PROMPT_VERSION } from "@/lib/claude/prompts/campaign";
import { mockCampaign } from "./mocks";
import { describeTarget } from "@/lib/finders/common";

export async function generateCampaignBrief(campaignId: string) {
  const [c] = await db.select().from(campaigns).where(eq(campaigns.id, campaignId));
  if (!c) throw new Error("Campaign not found");
  const { output, runId } = await runJob({
    jobType: "campaign_generate", subjectType: "campaign", subjectId: c.id,
    model: MODELS.sonnet, effort: "medium", promptVersion: CAMPAIGN_PROMPT_VERSION, maxTokens: 8000,
    system: campaignSystemPrompt(),
    user: campaignUserPrompt({ name: c.name, persona: c.persona, corridor: c.corridor, offer: c.offer, goal: c.goal, notes: c.notes, today: new Date().toISOString().slice(0, 10), target: describeTarget(c) }),
    schema: CampaignBriefSchema,
    mock: () => mockCampaign({ name: c.name, persona: c.persona, corridor: c.corridor }),
  });
  await db.update(campaigns).set({ brief: output, agentRunId: runId }).where(eq(campaigns.id, c.id));
  return output;
}
