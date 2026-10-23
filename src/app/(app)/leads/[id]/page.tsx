import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { campaigns, companies, evidence, messages, people, scores } from "@/db/schema";
import { PageHeader } from "@/components/app/page-header";
import { Pill, statusTone, tierTone } from "@/components/ui/pill";
import { WEIGHTS } from "@/lib/claude/scoring";
import { LeadActions } from "./actions";

const LABELS: Record<string, string> = {
  C1_firmographic_fit: "Firmographic fit", C2_expansion_intent: "Expansion intent", C3_buyer_role: "Buyer role", C4_timing: "Timing",
  C5_budget_proxies: "Budget proxies", C6_consumer_relevance: "Consumer relevance", C7_finops_need: "Finance / ops need", C8_reachability: "Reachability",
};

// Research + scoring + drafting can take 1-3 minutes. Vercel allows up to 300s on Hobby and 800s on Pro.
export const maxDuration = 300;

export default async function LeadDetail({ params }: PageProps<"/leads/[id]">) {
  const { id } = await params;
  const [p] = await db.select().from(people).where(eq(people.id, id));
  if (!p) notFound();
  // Run the remaining lookups in parallel: each one is a round trip to the database.
  const [coRows, campRows, scoreRows, ev, msgs] = await Promise.all([
    p.companyId ? db.select().from(companies).where(eq(companies.id, p.companyId)) : Promise.resolve([]),
    p.campaignId ? db.select().from(campaigns).where(eq(campaigns.id, p.campaignId)) : Promise.resolve([]),
    db.select().from(scores).where(eq(scores.personId, id)).orderBy(desc(scores.createdAt)).limit(1),
    p.companyId ? db.select().from(evidence).where(eq(evidence.companyId, p.companyId)) : Promise.resolve([]),
    db.select().from(messages).where(eq(messages.personId, id)).orderBy(desc(messages.createdAt)),
  ]);
  const co = coRows[0] ?? null;
  const camp = campRows[0] ?? null;
  const score = scoreRows[0];
  const current = msgs.filter((m) => m.status !== "superseded");

  return (
    <>
      <PageHeader title={p.fullName} description={[p.title, co?.name, p.country].filter(Boolean).join(" · ")}
        action={<div className="flex items-center gap-2">{p.tier && <Pill tone={tierTone(p.tier)}>Tier {p.tier}</Pill>}<Pill tone={statusTone(p.status)}>{p.status.replace(/_/g, " ")}</Pill></div>} />

      <div className="grid lg:grid-cols-3 gap-6 fade-up">
        <div className="lg:col-span-2 space-y-6">
          <section className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="h-section">Qualification</h3>
              {score && <div className="text-[26px] font-semibold tracking-[-0.03em]">{score.total}<span className="t-caption">/100</span></div>}
            </div>
            {!score ? <p className="t-caption">Not qualified yet. Run the pipeline to research the company, score the fit and draft outreach.</p> : (
              <>
                <p className="t-body mb-5">{score.reviewerSummary}</p>
                <div className="space-y-2.5">
                  {Object.keys(WEIGHTS).map((k) => {
                    const pts = score.points[k] ?? 0; const w = WEIGHTS[k]; const lvl = score.levels[k];
                    return (
                      <div key={k} className="grid grid-cols-[150px_1fr_80px] items-center gap-3 text-[13px]">
                        <div className="text-ink-2">{LABELS[k]}</div>
                        <div className="h-1.5 rounded-full bg-line overflow-hidden"><div className="h-full rounded-full bg-accent" style={{ width: `${(pts / w) * 100}%` }} /></div>
                        <div className="text-right t-mono">{lvl} · {pts}/{w}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {score.confidence && <Pill>confidence: {score.confidence}</Pill>}
                  {score.primaryOffer && <Pill tone="accent">{score.primaryOffer.replace(/_/g, " ")}</Pill>}
                  {(score.flags ?? []).map((f) => <Pill key={f} tone={f.startsWith("escalate") ? "warning" : "neutral"}>{f}</Pill>)}
                </div>
              </>
            )}
          </section>

          {current.length > 0 && (
            <section className="card p-6">
              <h3 className="h-section mb-4">Outreach drafts</h3>
              <div className="space-y-4">
                {current.map((m) => (
                  <div key={m.id} className="rounded-xl border border-line bg-surface-2 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2"><Pill tone={m.channel === "email" ? "accent" : "neutral"}>{m.channel} · step {m.step}</Pill><Pill tone={statusTone(m.status)}>{m.status.replace("_", " ")}</Pill></div>
                      {(m.qaFlags ?? []).map((f) => <Pill key={f} tone="warning">{f}</Pill>)}
                    </div>
                    {m.subject && <div className="text-[14px] font-medium mb-1">{m.subject}</div>}
                    <pre className="whitespace-pre-wrap font-sans text-[14px] leading-relaxed">{m.body}</pre>
                  </div>
                ))}
              </div>
              {p.status === "in_review" && <p className="t-caption mt-3">These are waiting in the <Link href="/review" className="text-accent">Review Queue</Link>.</p>}
            </section>
          )}

          <section className="card p-6">
            <h3 className="h-section mb-3">Evidence ledger <span className="t-caption">({ev.length})</span></h3>
            {ev.length === 0 ? <p className="t-caption">No research yet.</p> : (
              <ul className="space-y-3">
                {ev.map((e) => (
                  <li key={e.id} className="text-[14px]">
                    <span className="t-mono text-accent mr-2">{e.evidenceId}</span>{e.claim}
                    <div className="t-caption mt-0.5">{e.publishedDate} · {e.url ? <a href={e.url} target="_blank" rel="noreferrer" className="hover:text-accent underline-offset-2 hover:underline">{e.title ?? e.url}</a> : "no url"}{e.citedText ? ` · “${e.citedText.slice(0, 120)}”` : ""}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <LeadActions id={p.id} status={p.status} tier={p.tier} doNotContact={p.doNotContact} />
          <section className="card p-6 space-y-3 text-[14px]">
            <h3 className="h-section">Details</h3>
            <Row k="Email" v={p.email ?? "—"} /><Row k="Email status" v={p.emailStatus} />
            <Row k="LinkedIn" v={p.linkedinUrl ? <a href={p.linkedinUrl} target="_blank" rel="noreferrer" className="text-accent">Open profile</a> : "—"} />
            <Row k="Company site" v={co?.domain ?? "—"} /><Row k="HQ" v={co?.hqCountry ?? "—"} />
            <Row k="Campaign" v={camp ? <Link href={`/campaigns/${camp.id}`} className="text-accent">{camp.name}</Link> : "—"} />
            <Row k="Lawful basis" v={p.lawfulBasis.replace(/_/g, " ")} /><Row k="Source" v={p.sourceDescription ?? p.source ?? "—"} />
            {p.notes && <Row k="Notes" v={p.notes} />}
          </section>
        </div>
      </div>
    </>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="flex justify-between gap-4"><span className="text-ink-2">{k}</span><span className="text-right break-all">{v}</span></div>;
}
