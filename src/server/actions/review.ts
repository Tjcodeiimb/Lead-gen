"use server";
import { and, eq } from "drizzle-orm";
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

export async function markSent(personId: string) {
  const user = await requireUser();
  await db.update(messages).set({ sentAt: new Date() }).where(and(eq(messages.personId, personId), eq(messages.status, "approved")));
  await db.update(people).set({ status: "sent", lastContactedAt: new Date() }).where(eq(people.id, personId));
  await db.insert(auditLog).values({ actor: `user:${user.email}`, action: "message.mark_sent", subjectType: "person", subjectId: personId });
  revalidatePath("/leads"); revalidatePath(`/leads/${personId}`);
}
