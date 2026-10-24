"use server";
import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db/client";
import { auditLog, messages, people, reviews } from "@/db/schema";
import { requireUser } from "@/lib/auth";

export async function saveMessage(messageId: string, subject: string | null, body: string) {
  await requireUser();
  await db.update(messages).set({ subject, body }).where(eq(messages.id, messageId));
  revalidatePath("/review");
}

export async function approveReview(reviewId: string) {
  const user = await requireUser();
  const [r] = await db.select().from(reviews).where(eq(reviews.id, reviewId));
  if (!r) return;
  const [p] = await db.select().from(people).where(eq(people.id, r.personId));
  if (!p || p.doNotContact) throw new Error("This lead is suppressed and cannot be approved.");
  await db.update(messages).set({ status: "approved", approvedAt: new Date() }).where(and(eq(messages.personId, r.personId), eq(messages.status, "pending")));
  await db.update(reviews).set({ status: "approved", decidedAt: new Date(), decision: { by: user.email } }).where(eq(reviews.id, reviewId));
  await db.update(people).set({ status: "approved" }).where(eq(people.id, r.personId));
  await db.insert(auditLog).values({ actor: `user:${user.email}`, action: "review.approve", subjectType: "person", subjectId: r.personId });
  revalidatePath("/review"); revalidatePath("/leads"); revalidatePath("/");
}

export async function rejectReview(reviewId: string, reason: string) {
  const user = await requireUser();
  const [r] = await db.select().from(reviews).where(eq(reviews.id, reviewId));
  if (!r) return;
  await db.update(messages).set({ status: "rejected" }).where(and(eq(messages.personId, r.personId), eq(messages.status, "pending")));
  await db.update(reviews).set({ status: "rejected", decidedAt: new Date(), decision: { by: user.email, reason } }).where(eq(reviews.id, reviewId));
  await db.update(people).set({ status: reason === "not_icp" || reason === "wrong_person" ? "disqualified" : "nurture" }).where(eq(people.id, r.personId));
  await db.insert(auditLog).values({ actor: `user:${user.email}`, action: "review.reject", subjectType: "person", subjectId: r.personId, details: { reason } });
  revalidatePath("/review"); revalidatePath("/leads"); revalidatePath("/");
}

/** Records that an email step went out and schedules the next one from its day offset. */
export async function markSent(personId: string, step?: number) {
  const user = await requireUser();
  const [p] = await db.select().from(people).where(eq(people.id, personId));
  if (!p) return;
  const current = step ?? p.nextStep ?? 1;
  const steps = await db.select().from(messages).where(and(eq(messages.personId, personId), eq(messages.channel, "email"), eq(messages.status, "approved"))).orderBy(asc(messages.step));
  const sent = steps.find((m) => m.step === current);
  if (sent) await db.update(messages).set({ sentAt: new Date() }).where(eq(messages.id, sent.id));
  const next = steps.find((m) => m.step > current && !m.sentAt);
  const base = steps.find((m) => m.step === 1)?.sentAt ?? new Date();
  const due = next ? new Date(base.getTime() + next.dayOffset * 86_400_000) : null;
  await db.update(people).set({
    status: next ? "sent" : "nurture", lastContactedAt: new Date(),
    nextStep: next?.step ?? null, nextStepDue: due ? due.toISOString().slice(0, 10) : null,
  }).where(eq(people.id, personId));
  await db.insert(auditLog).values({ actor: `user:${user.email}`, action: "message.mark_sent", subjectType: "person", subjectId: personId, details: { step: current } });
  revalidatePath("/leads"); revalidatePath(`/leads/${personId}`); revalidatePath("/");
}

export async function markReplied(personId: string, outcome: "replied" | "meeting_booked" | "not_now") {
  const user = await requireUser();
  await db.update(people).set({ status: outcome === "not_now" ? "nurture" : outcome, nextStep: null, nextStepDue: null }).where(eq(people.id, personId));
  await db.insert(auditLog).values({ actor: `user:${user.email}`, action: `lead.${outcome}`, subjectType: "person", subjectId: personId });
  revalidatePath("/leads"); revalidatePath(`/leads/${personId}`); revalidatePath("/");
}

/** Creates Gmail drafts for a lead's approved emails that don't have one yet. */
export async function draftInGmail(personId: string): Promise<{ ok: true; created: number } | { ok: false; error: string }> {
  const user = await requireUser();
  try {
    const { createDraft } = await import("@/lib/gmail");
    const [p] = await db.select().from(people).where(eq(people.id, personId));
    if (!p) return { ok: false, error: "Lead not found" };
    if (!p.email) return { ok: false, error: "This lead has no email address yet." };
    if (p.doNotContact) return { ok: false, error: "This lead is suppressed." };
    const steps = await db.select().from(messages).where(and(eq(messages.personId, personId), eq(messages.channel, "email"), eq(messages.status, "approved"))).orderBy(asc(messages.step));
    let created = 0;
    for (const m of steps) {
      if (m.gmailDraftId) continue;
      const d = await createDraft({ to: p.email, subject: m.subject ?? "", body: m.body });
      await db.update(messages).set({ gmailDraftId: d.id }).where(eq(messages.id, m.id));
      created++;
    }
    await db.insert(auditLog).values({ actor: `user:${user.email}`, action: "gmail.drafts_created", subjectType: "person", subjectId: personId, details: { created } });
    revalidatePath(`/leads/${personId}`);
    return { ok: true, created };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}
