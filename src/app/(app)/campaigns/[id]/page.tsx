import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { campaigns, people } from "@/db/schema";
import { PageHeader } from "@/components/app/page-header";
import { Pill, statusTone, tierTone } from "@/components/ui/pill";
import { GenerateBriefButton, StatusButtons } from "./controls";
import { Upload } from "lucide-react";

export default async function CampaignDetail({ params, searchParams }: PageProps<"/campaigns/[id]">) {
  const { id } = await params;
  const sp = await searchParams;
  const [c] = await db.select().from(campaigns).where(eq(campaigns.id, id));
  if (!c) notFound();
  const leads = await db.select().from(people).where(eq(people.campaignId, id)).orderBy(desc(people.createdAt)).limit(50);
  const b = c.brief;

  return (
    <>
      <PageHeader title={c.name} description={`Persona ${c.persona} · ${c.corridor} · ${c.offer}${c.goal ? ` · ${c.goal}` : ""}`}
        action={<div className="flex items-center gap-2"><Pill tone={statusTone(c.status)}>{c.status}</Pill><StatusButtons id={c.id} status={c.status} /></div>} />

      {!b ? (
        <div className="card p-10 text-center fade-up">
          <h3 className="h-title mb-2">Generate the plan</h3>
          <p className="t-body text-ink-2 max-w-md mx-auto mb-6">Claude will write the ICP, the signals to watch, ten subject lines, a 5-step sequence, a LinkedIn note and objection handling. You edit it afterwards.</p>
          <GenerateBriefButton id={c.id} autoStart={sp.generate === "1"} />
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6 fade-up">
          <div className="lg:col-span-2 space-y-6">
            <section className="card p-6">
              <h3 className="h-section mb-3">Positioning</h3>
              <p className="t-body">{b.positioning}</p>
            </section>
            <section className="card p-6">
              <h3 className="h-section mb-3">Sequence</h3>
              <ol className="space-y-4">
                {b.sequence.map((s) => (
                  <li key={s.step} className="grid grid-cols-[72px_1fr] gap-4">
                    <div><div className="text-[13px] font-semibold">Day {s.day}</div><Pill tone={s.channel === "email" ? "accent" : "neutral"}>{s.channel}</Pill></div>
                    <div><div className="t-caption mb-1">{s.purpose}</div><pre className="whitespace-pre-wrap font-sans text-[14px] leading-relaxed bg-surface-2 rounded-xl p-4 border border-line">{s.body}</pre></div>
                  </li>
                ))}
              </ol>
            </section>
            <section className="card p-6">
              <h3 className="h-section mb-3">Objections</h3>
              <dl className="space-y-3">{b.objections.map((o, i) => <div key={i}><dt className="text-[14px] font-medium">“{o.objection}”</dt><dd className="t-body text-ink-2">{o.response}</dd></div>)}</dl>
            </section>
          </div>
          <div className="space-y-6">
            <section className="card p-6">
              <h3 className="h-section mb-3">Ideal customer</h3>
              <p className="t-body mb-3">{b.icp.summary}</p>
              <div className="t-caption font-medium mb-1 text-ink">Must have</div>
              <ul className="list-disc pl-4 t-caption space-y-1 mb-3">{b.icp.must_haves.map((m, i) => <li key={i}>{m}</li>)}</ul>
              <div className="t-caption font-medium mb-1 text-ink">Exclude</div>
              <ul className="list-disc pl-4 t-caption space-y-1 mb-3">{b.icp.exclusions.map((m, i) => <li key={i}>{m}</li>)}</ul>
              <div className="flex flex-wrap gap-1.5">{b.icp.buyer_titles.map((t) => <Pill key={t}>{t}</Pill>)}</div>
            </section>
            <section className="card p-6">
              <h3 className="h-section mb-3">Signals to watch</h3>
              <ul className="space-y-3">{b.signals.map((s, i) => <li key={i}><div className="text-[14px] font-medium">{s.type}</div><div className="t-caption">{s.why}</div><div className="t-mono mt-1 text-ink-2">{s.detection}</div></li>)}</ul>
            </section>
            <section className="card p-6">
              <h3 className="h-section mb-3">Subject lines</h3>
              <div className="flex flex-wrap gap-1.5">{b.subject_lines.map((s) => <Pill key={s}>{s}</Pill>)}</div>
            </section>
            <section className="card p-6">
              <h3 className="h-section mb-3">LinkedIn note</h3>
              <p className="t-body">{b.linkedin_note}</p>
              <div className="t-caption mt-2">{b.linkedin_note.length}/300 characters</div>
            </section>
            {b.risks.length > 0 && <section className="card p-6"><h3 className="h-section mb-3">Risks</h3><ul className="list-disc pl-4 t-caption space-y-1">{b.risks.map((r, i) => <li key={i}>{r}</li>)}</ul></section>}
            <GenerateBriefButton id={c.id} variant="secondary" label="Regenerate plan" />
          </div>
        </div>
      )}

      <section className="card mt-6 overflow-hidden fade-up">
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h3 className="h-section">Leads in this campaign <span className="t-caption">({leads.length})</span></h3>
          <Link href={`/leads/import?campaignId=${c.id}`} className="btn btn-secondary btn-sm"><Upload className="h-3.5 w-3.5" /> Import CSV</Link>
        </div>
        {leads.length === 0 ? <p className="px-6 pb-6 t-caption">No leads yet. Import a CSV or add one manually from the Leads page.</p> : (
          <table className="table"><thead><tr><th>Name</th><th>Title</th><th>Tier</th><th>Score</th><th>Status</th></tr></thead>
            <tbody>{leads.map((l) => <tr key={l.id}><td className="font-medium"><Link href={`/leads/${l.id}`} className="hover:text-accent">{l.fullName}</Link></td><td className="t-caption">{l.title}</td><td>{l.tier && <Pill tone={tierTone(l.tier)}>{l.tier}</Pill>}</td><td>{l.score ?? ""}</td><td><Pill tone={statusTone(l.status)}>{l.status.replace("_", " ")}</Pill></td></tr>)}</tbody></table>
        )}
      </section>
    </>
  );
}
