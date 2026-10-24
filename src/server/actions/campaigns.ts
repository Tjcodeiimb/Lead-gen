"use server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { auditLog, campaigns } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { generateCampaignBrief } from "@/lib/jobs/campaign";

const CreateCampaign = z.object({
  name: z.string().min(2).max(120),
  persona: z.enum(["A", "B", "C", "D", "E", "F", "G"]),
  offer: z.string().min(3),
  goal: z.string().max(500).optional(),
  notes: z.string().max(4000).optional(),
  niche: z.string().min(1),
  subNiche: z.string().optional(),
  companyCountry: z.string().max(2).optional(),
  companyCity: z.string().max(80).optional(),
  targetCountry: z.string().max(2).optional(),
  targetCity: z.string().max(80).optional(),
  companySizes: z.array(z.string()).optional(),
  roles: z.array(z.string()).optional(),
  keywords: z.string().max(300).optional(),
});

const str = (v: FormDataEntryValue | null) => (typeof v === "string" && v.trim() ? v.trim() : undefined);

export async function createCampaign(formData: FormData) {
  const user = await requireUser();
  const input = CreateCampaign.parse({
    name: formData.get("name"), persona: formData.get("persona"), offer: formData.get("offer"),
    goal: str(formData.get("goal")), notes: str(formData.get("notes")),
    niche: formData.get("niche"), subNiche: str(formData.get("subNiche")),
    companyCountry: str(formData.get("companyCountry")), companyCity: str(formData.get("companyCity")),
    targetCountry: str(formData.get("targetCountry")), targetCity: str(formData.get("targetCity")),
    companySizes: formData.getAll("companySizes").map(String), roles: formData.getAll("roles").map(String),
    keywords: str(formData.get("keywords")),
  });
  const corridor = `${input.companyCountry ?? "XX"}->${input.targetCountry ?? "XX"}`;
  const [c] = await db.insert(campaigns).values({ ...input, corridor }).returning({ id: campaigns.id });
  await db.insert(auditLog).values({ actor: `user:${user.email}`, action: "campaign.create", subjectType: "campaign", subjectId: c.id, details: input });
  redirect(`/campaigns/${c.id}?generate=1`);
}

export async function generateBrief(campaignId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireUser();
  try {
    await generateCampaignBrief(campaignId);
    await db.insert(auditLog).values({ actor: `user:${user.email}`, action: "campaign.generate_brief", subjectType: "campaign", subjectId: campaignId });
    revalidatePath(`/campaigns/${campaignId}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function setCampaignStatus(campaignId: string, status: "draft" | "active" | "paused" | "completed" | "archived") {
  const user = await requireUser();
  await db.update(campaigns).set({ status }).where(eq(campaigns.id, campaignId));
  await db.insert(auditLog).values({ actor: `user:${user.email}`, action: `campaign.status.${status}`, subjectType: "campaign", subjectId: campaignId });
  revalidatePath(`/campaigns/${campaignId}`); revalidatePath("/campaigns");
}
