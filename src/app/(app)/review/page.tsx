import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { CheckSquare } from "lucide-react";
import { db } from "@/db/client";
import { companies, messages, people, reviews, scores } from "@/db/schema";
import { PageHeader } from "@/components/app/page-header";
import { Empty } from "@/components/ui/empty";
import { ReviewQueue, type ReviewItem } from "./queue";

export default async function ReviewPage() {
  const pending = await db.select().from(reviews).where(eq(reviews.status, "pending")).orderBy(desc(reviews.priority), asc(reviews.createdAt)).limit(50);
  const items: ReviewItem[] = [];
  for (const r of pending) {
    const [p] = await db.select().from(people).where(eq(people.id, r.personId));
    if (!p) continue;
    const co = p.companyId ? (await db.select().from(companies).where(eq(companies.id, p.companyId)))[0] : null;
    const [s] = await db.select().from(scores).where(and(eq(scores.personId, p.id), eq(scores.isCurrent, true))).limit(1);
    const msgs = await db.select().from(messages).where(and(eq(messages.personId, p.id), inArray(messages.status, ["pending"]))).orderBy(asc(messages.channel), asc(messages.step));
    items.push({
      reviewId: r.id, personId: p.id, name: p.fullName, title: p.title, company: co?.name ?? null, email: p.email, linkedinUrl: p.linkedinUrl,
      tier: p.tier, score: p.score, summary: s?.reviewerSummary ?? null, hooks: s?.hooks ?? [], flags: s?.flags ?? [],
      messages: msgs.map((m) => ({ id: m.id, channel: m.channel, step: m.step, subject: m.subject, body: m.body, qaFlags: m.qaFlags ?? [], factsUsed: m.factsUsed ?? [] })),
    });
  }
  return (
    <>
      <PageHeader title="Review Queue" description="Nothing leaves without you. Read, edit if needed, then approve or reject. Keyboard: J/K to move, A approve, X reject." />
      {items.length === 0 ? <div className="card fade-up"><Empty icon={CheckSquare} title="Inbox zero" description="Run the pipeline on a lead and the drafts will land here." /></div> : <ReviewQueue items={items} />}
    </>
  );
}
