import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { campaigns, companies, evidence, messages, people, reviews, scores } from "@/db/schema";
import { runJob } from "@/lib/claude/runner";
import { MODELS } from "@/lib/claude/models";
import { CopyPackageSchema } from "@/lib/claude/schemas/copy";
import { copySystemPrompt, COPY_PROMPT_VERSION } from "@/lib/claude/prompts/copy";
import { bannedPhrases } from "@/lib/kb";
import { mockCopy } from "./mocks";

const PREAMBLES = [/^\s*(hi|hello|dear)[^\n]*\n+\s*(i hope|hope you|my name is|i wanted to|i am reaching|i'm reaching|allow me|just wanted)/i];
const SIGNOFF = /^\s*(shardul\b|best\b|regards\b|thanks\b|cheers\b|warmly\b|—|--)/im;

/** The part of an email that the reader actually reads: after the greeting, before the sign-off. */
export function emailCore(body: string) {
  let core = body;
  const sign = core.search(SIGNOFF);
  if (sign > 0) core = core.slice(0, sign);
  core = core.replace(/^\s*(hi|hello|dear)\b[^\n]*\n/i, "");
  return core.trim();
}

export function countSentences(text: string) {
  return text.split(/(?<=[.?!])\s+|\n{2,}/).map((x) => x.trim()).filter((x) => /[a-z]/i.test(x)).length;
}

/** Deterministic QA gates (docs/research/04 §3.9 plus the cold-email craft rules in kb/voice.md). */
export function qaFlags(subject: string, body: string, linkedin: string, factsUsed: { evidence_id: string }[], validIds: Set<string>) {
  const flags: string[] = [];
  const core = emailCore(body);
  if (countSentences(core) > 5) flags.push("over_5_sentences");
  if ((core.match(/\?/g) ?? []).length > 1) flags.push("more_than_one_ask");
  if (PREAMBLES.some((re) => re.test(body))) flags.push("preamble_opener");
  if (body.trim().split(/\s+/).length > 120) flags.push("email_over_120_words");
  const subjWords = subject.trim().split(/\s+/).filter(Boolean).length;
  if (subjWords > 5) flags.push("subject_over_5_words");
  if (/[:?]/.test(subject)) flags.push("subject_has_colon_or_question");
  if (subject !== subject.toLowerCase()) flags.push("subject_not_lowercase");
  if (linkedin.length > 300) flags.push("linkedin_over_300_chars");
  if (/[!]/.test(body) || /[!]/.test(subject)) flags.push("exclamation_mark");
  if (!/reply\s+'?no'?/i.test(body)) flags.push("missing_opt_out");
  if (/https?:\/\//i.test(body)) flags.push("link_in_body");
  if (/\$\s?\d|₹\s?\d|USD\s?\d/.test(body)) flags.push("price_mentioned");
  if (/just (bumping|checking in|following up)/i.test(body)) flags.push("empty_follow_up");
  const lower = (body + " " + subject + " " + linkedin).toLowerCase();
  for (const phrase of bannedPhrases()) if (phrase && lower.includes(phrase)) { flags.push(`banned_phrase:${phrase}`); break; }
  if (factsUsed.length === 0) flags.push("no_cited_fact");
  if (factsUsed.some((f) => !validIds.has(f.evidence_id))) flags.push("fact_without_evidence");
  return flags;
}

export async function writeCopyForPerson(personId: string) {
  const [p] = await db.select().from(people).where(eq(people.id, personId));
  if (!p) throw new Error("Lead not found");
  const co = p.companyId ? (await db.select().from(companies).where(eq(companies.id, p.companyId)))[0] : undefined;
  const camp = p.campaignId ? (await db.select().from(campaigns).where(eq(campaigns.id, p.campaignId)))[0] : undefined;
  const [score] = await db.select().from(scores).where(and(eq(scores.personId, p.id), eq(scores.isCurrent, true))).orderBy(desc(scores.createdAt)).limit(1);
  const ev = co ? await db.select().from(evidence).where(eq(evidence.companyId, co.id)) : [];
  const validIds = new Set<string>([...ev.map((e) => e.evidenceId), ...Array.from({ length: 11 }, (_, i) => `K${i + 1}`)]);
  const market = camp?.corridor?.split("->")[1]?.trim() || "the target market";
  const firstName = p.firstName || p.fullName.split(" ")[0];

  const { output, runId, costUsd } = await runJob({
    jobType: "copy", subjectType: "person", subjectId: p.id,
    model: MODELS.opus, effort: "medium", promptVersion: COPY_PROMPT_VERSION, maxTokens: 4000,
    system: copySystemPrompt(),
    user: `TODAY: ${new Date().toISOString().slice(0, 10)}
<lead>name=${p.fullName}; first_name=${firstName}; title=${p.title ?? "unknown"}; company=${co?.name ?? "unknown"}; country=${p.country ?? "unknown"}</lead>
<campaign>${camp ? JSON.stringify({ name: camp.name, persona: camp.persona, corridor: camp.corridor, offer: camp.offer, positioning: camp.brief?.positioning, subject_lines: camp.brief?.subject_lines, sequence: camp.brief?.sequence?.slice(0, 3) }) : "(no campaign)"}</campaign>
<qualification>${score ? JSON.stringify({ tier: score.tier, total: score.total, primary_offer: score.primaryOffer, reviewer_summary: score.reviewerSummary, hooks: score.hooks }) : "(not qualified yet)"}</qualification>
<evidence_pack>${JSON.stringify(ev.map((e) => ({ id: e.evidenceId, claim: e.claim, url: e.url, date: e.publishedDate, cited_text: e.citedText })))}</evidence_pack>
Write the outreach package. Use the schema.`,
    schema: CopyPackageSchema,
    mock: () => mockCopy({ firstName, company: co?.name ?? "the company", market }),
  });

  const flags = qaFlags(output.email.subject, output.email.body, output.linkedin_note, output.facts_used, validIds);
  await db.update(messages).set({ status: "superseded" }).where(eq(messages.personId, p.id));
  const fu = (step: number, day: number, m: { subject: string; body: string }) => ({
    personId: p.id, campaignId: p.campaignId, agentRunId: runId, channel: "email" as const, step, dayOffset: day, subject: m.subject, body: m.body,
    qaFlags: [countSentences(emailCore(m.body)) > 3 ? "follow_up_over_3_sentences" : "", /just (bumping|checking in|following up)/i.test(m.body) ? "empty_follow_up" : ""].filter(Boolean),
  });
  await db.insert(messages).values([
    { personId: p.id, campaignId: p.campaignId, agentRunId: runId, channel: "email", step: 1, dayOffset: 0, subject: output.email.subject, body: output.email.body, factsUsed: output.facts_used, qaFlags: flags },
    fu(2, 4, output.follow_up),
    fu(3, 9, output.follow_up_2),
    fu(4, 18, output.close),
    { personId: p.id, campaignId: p.campaignId, agentRunId: runId, channel: "linkedin", step: 1, dayOffset: 1, subject: null, body: output.linkedin_note, qaFlags: output.linkedin_note.length > 300 ? ["linkedin_over_300_chars"] : [] },
  ]);
  await db.update(reviews).set({ status: "superseded" }).where(eq(reviews.personId, p.id));
  await db.insert(reviews).values({ personId: p.id, kind: "lead_package", priority: p.tier === "A" ? 90 : 50 });
  await db.update(people).set({ status: "in_review" }).where(eq(people.id, p.id));
  return { output, flags, costUsd };
}
