import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { CheckSquare } from "lucide-react";
import { db } from "@/db/client";
import { companies, messages, people, reviews, scores } from "@/db/schema";
import { PageHeader } from "@/components/app/page-header";
import { Empty } from "@/components/ui/empty";
import { ReviewQueue, type ReviewItem } from "./queue";

export default async function ReviewPage() {
  // Three round trips total, however many leads are waiting (was four per lead).
  const rows = await db
    .select({ r: reviews, p: people, company: companies.name, s: scores })
    .from(reviews)
    .innerJoin(people, eq(people.id, reviews.personId))
    .leftJoin(companies, eq(companies.id, people.companyId))
    .leftJoin(scores, and(eq(scores.personId, people.id), eq(scores.isCurrent, true)))
    .where(eq(reviews.status, "pending"))
    .orderBy(desc(reviews.priority), asc(reviews.createdAt))
    .limit(50);

  const personIds = rows.map((x) => x.p.id);
  const msgs = personIds.length
    ? await db.select().from(messages).where(and(inArray(messages.personId, personIds), eq(messages.status, "pending"))).orderBy(asc(messages.channel), asc(messages.step))
    : [];

  const items: ReviewItem[] = rows.map(({ r, p, company, s }) => ({
    reviewId: r.id, personId: p.id, name: p.fullName, title: p.title, company, email: p.email, linkedinUrl: p.linkedinUrl,
    tier: p.tier, score: p.score, summary: s?.reviewerSummary ?? null, hooks: s?.hooks ?? [], flags: s?.flags ?? [],
    messages: msgs.filter((m) => m.personId === p.id).map((m) => ({ id: m.id, channel: m.channel, step: m.step, subject: m.subject, body: m.body, qaFlags: m.qaFlags ?? [], factsUsed: m.factsUsed ?? [] })),
  }));

  return (
    <>
      <PageHeader title="Review Queue" description="Nothing leaves without you. Read, edit if needed, then approve or reject. Keyboard: J/K to move, A approve (press twice), X reject." />
      {items.length === 0 ? <div className="card fade-up"><Empty icon={CheckSquare} title="Inbox zero" description="Run the pipeline on a lead and the drafts will land here." /></div> : <ReviewQueue items={items} />}
    </>
  );
}
