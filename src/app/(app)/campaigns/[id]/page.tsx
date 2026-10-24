import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { campaigns, candidates, finderRuns, people } from "@/db/schema";
import { PageHeader } from "@/components/app/page-header";
import { Pill, statusTone, tierTone } from "@/components/ui/pill";
import { GenerateBriefButton, StatusButtons } from "./controls";
import { FindLeads } from "./find-leads";
import { RowLink } from "@/components/app/row-link";
import { candidateCounts, describeTarget } from "@/lib/finders/common";
import { getAllKeyStatus } from "@/lib/integrations/keys";
import { isMock } from "@/lib/claude/client";
import { Upload } from "lucide-react";

// Finders and plan generation can take 1-3 minutes.
export const maxDuration = 300;

export default async function CampaignDetail({ params, searchParams }: PageProps<"/campaigns/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const [c] = await db.select().from(campaigns).where(eq(campaigns.id, id));
  if (!c) notFound();
  const [leads, cands, runs, counts, keys, mock] = await Promise.all([
    db.select().from(people).where(eq(people.campaignId, id)).orderBy(desc(people.createdAt)).limit(100),
    db.select().from(candidates).where(and(eq(candidates.campaignId, id), eq(candidates.status, "new"))).orderBy(desc(candidates.confidence), desc(candidates.createdAt)).limit(200),
    db.select().from(finderRuns).where(eq(finderRuns.campaignId, id)).orderBy(desc(finderRuns.startedAt)).limit(10),
    candidateCounts(id),
    getAllKeyStatus(),
    isMock(),
  ]);
  const t = describeTarget(c);
  const b = c.brief;
  const tab = typeof sp.tab === "string" ? sp.tab : "find";

  return (
    <>
      <PageHeader title={c.name} description={t.summary}
        action={<div className="flex items-center gap-2"><Pill tone={statusTone(c.status)}>{c.status}</Pill><StatusButtons id={c.id} status={c.status} /></div>} />

      <div className="flex flex-wrap gap-1.5 mb-6 fade-up">
        <Pill tone="accent">{t.niche}</Pill>
        {t.sizes.length > 0 && <Pill>{t.sizes.map((s) => s.replace(",", "–").replace(/–$/, "+")).join(", ")} staff</Pill>}
        {t.titles.slice(0, 4).map((x) => <Pill key={x}>{x}</Pill>)}
        {t.titles.length > 4 && <Pill>+{t.titles.length - 4} titles</Pill>}
      </div>

      <nav className="flex gap-1 mb-6 border-b border-line fade-up">
        {[["find", `Find leads${counts.fresh ? ` (${counts.fresh})` : ""}`], ["leads", `Leads (${leads.length})`], ["plan", "Plan"]].map(([k, label]) => (
          <Link key={k} href={`/campaigns/${c.id}?tab=${k}`} className={`px-4 py-2.5 text-[14px] font-medium border-b-2 -mb-px transition ${tab === k ? "border-accent text-ink" : "border-transparent text-ink-2 hover:text-ink"}`}>{label}</Link>
        ))}
      </nav>

      {tab === "find" && (
        <FindLeads campaignId={c.id} candidates={cands} runs={runs} counts={counts}
          keys={{ apollo: keys.apollo_api_key.set, hunter: keys.hunter_api_key.set || keys.anymailfinder_api_key.set || keys.prospeo_api_key.set, theirstack: keys.theirstack_api_key.set, companiesHouse: keys.companies_house_api_key.set }}
          mock={mock} />
      )}

      {tab === "leads" && (
        <section className="card overflow-hidden fade-up">
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <h3 className="h-section">Imported leads</h3>
            <Link href={`/leads/import?campaignId=${c.id}`} className="btn btn-secondary btn-sm"><Upload className="h-3.5 w-3.5" /> Import CSV</Link>
          </div>
          {leads.length === 0 ? <p className="px-6 pb-6 t-caption">No leads yet. Use Find leads, or import a CSV.</p> : (
            <div className="table-wrap"><table className="table"><thead><tr><th>Name</th><th>Title</th><th>Email</th><th>Tier</th><th>Score</th><th>Status</th></tr></thead>
              <tbody>{leads.map((l) => <RowLink key={l.id} href={`/leads/${l.id}`}><td className="font-medium">{l.fullName}</td><td className="t-caption">{l.title}</td><td className="t-caption">{l.email ?? "—"}</td><td>{l.tier && <Pill tone={tierTone(l.tier)}>{l.tier}</Pill>}</td><td>{l.score ?? ""}</td><td><Pill tone={statusTone(l.status)}>{l.status.replace(/_/g, " ")}</Pill></td></RowLink>)}</tbody></table></div>
          )}
        </section>
      )}

      {tab === "plan" && (!b ? (
        <div className="card p-10 text-center fade-up">
          <h3 className="h-title mb-2">Generate the plan</h3>
          <p className="t-body text-ink-2 max-w-md mx-auto mb-6">Claude writes the positioning, the signals to watch, subject lines, a 5-step sequence and objection handling for this target.</p>
          <GenerateBriefButton id={c.id} autoStart={sp.generate === "1"} />
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6 fade-up">
          <div className="lg:col-span-2 space-y-6">
            <section className="card p-6"><h3 className="h-section mb-3">Positioning</h3><p className="t-body">{b.positioning}</p></section>
            <section className="card p-6">
              <h3 className="h-section mb-3">Sequence</h3>
              <ol className="space-y-4">{b.sequence.map((s) => (
                <li key={s.step} className="grid grid-cols-[72px_1fr] gap-4">
                  <div><div className="text-[13px] font-semibold">Day {s.day}</div><Pill tone={s.channel === "email" ? "accent" : "neutral"}>{s.channel}</Pill></div>
                  <div><div className="t-caption mb-1">{s.purpose}</div><pre className="whitespace-pre-wrap font-sans text-[14px] leading-relaxed bg-surface-2 rounded-xl p-4 border border-line">{s.body}</pre></div>
                </li>))}</ol>
            </section>
            <section className="card p-6"><h3 className="h-section mb-3">Objections</h3><dl className="space-y-3">{b.objections.map((o, i) => <div key={i}><dt className="text-[14px] font-medium">“{o.objection}”</dt><dd className="t-body text-ink-2">{o.response}</dd></div>)}</dl></section>
          </div>
          <div className="space-y-6">
            <section className="card p-6"><h3 className="h-section mb-3">Ideal customer</h3><p className="t-body mb-3">{b.icp.summary}</p><div className="flex flex-wrap gap-1.5">{b.icp.buyer_titles.map((x) => <Pill key={x}>{x}</Pill>)}</div></section>
            <section className="card p-6"><h3 className="h-section mb-3">Signals to watch</h3><ul className="space-y-3">{b.signals.map((s, i) => <li key={i}><div className="text-[14px] font-medium">{s.type}</div><div className="t-caption">{s.why}</div></li>)}</ul></section>
            <section className="card p-6"><h3 className="h-section mb-3">Subject lines</h3><div className="flex flex-wrap gap-1.5">{b.subject_lines.map((s) => <Pill key={s}>{s}</Pill>)}</div></section>
            {b.risks.length > 0 && <section className="card p-6"><h3 className="h-section mb-3">Risks</h3><ul className="list-disc pl-4 t-caption space-y-1">{b.risks.map((r, i) => <li key={i}>{r}</li>)}</ul></section>}
            <GenerateBriefButton id={c.id} variant="secondary" label="Regenerate plan" />
          </div>
        </div>
      ))}
    </>
  );
}
