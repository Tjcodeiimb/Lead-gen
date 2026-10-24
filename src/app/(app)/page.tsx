import Link from "next/link";
import { count, desc, eq, gte, sql } from "drizzle-orm";
import { ArrowRight, Megaphone } from "lucide-react";
import { db } from "@/db/client";
import { agentRuns, campaigns, candidates, companies, people, reviews } from "@/db/schema";
import { PageHeader } from "@/components/app/page-header";
import { Stat } from "@/components/app/stat";
import { Pill, statusTone, tierTone } from "@/components/ui/pill";
import { formatUsd, timeAgo } from "@/lib/utils";
import { isMock } from "@/lib/claude/client";
import { countryName, nicheLabel } from "@/lib/targeting";

export default async function Dashboard() {
  const mock = await isMock();
  const monthStart = new Date(); monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
  const today = new Date().toISOString().slice(0, 10);
  const [[leads], [qualified], [pending], [spend], recentCampaigns, recentRuns, due, [cands]] = await Promise.all([
    db.select({ n: count() }).from(people),
    db.select({ n: count() }).from(people).where(sql`${people.tier} in ('A','B')`),
    db.select({ n: count() }).from(reviews).where(eq(reviews.status, "pending")),
    db.select({ usd: sql<string>`coalesce(sum(${agentRuns.costUsd}),0)` }).from(agentRuns).where(gte(agentRuns.createdAt, monthStart)),
    db.select().from(campaigns).orderBy(desc(campaigns.createdAt)).limit(5),
    db.select().from(agentRuns).orderBy(desc(agentRuns.createdAt)).limit(8),
    db.select({ p: people, company: companies.name }).from(people).leftJoin(companies, eq(companies.id, people.companyId)).where(sql`${people.nextStepDue} <= ${today}`).orderBy(people.nextStepDue).limit(10),
    db.select({ n: count() }).from(candidates).where(eq(candidates.status, "new")),
  ]);

  return (
    <>
      <PageHeader title="Good to see you." description="Here's where the pipeline stands. Everything outbound waits for your approval." />
      {mock && (
        <div className="card p-4 mb-6 flex items-center gap-3 fade-up">
          <Pill tone="warning">Mock mode</Pill>
          <span className="t-caption">No Claude API key yet, so every generation returns a realistic sample at zero cost. Paste your key on the Integrations page to go live.</span>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8 fade-up">
        <Stat label="Candidates to review" value={cands.n} hint={cands.n ? "Found by the finders, not yet imported" : "Run a finder in a campaign"} />
        <Stat label="Leads" value={leads.n} />
        <Stat label="Qualified (A/B)" value={qualified.n} />
        <Stat label="Awaiting your review" value={pending.n} hint={pending.n ? "Approve or reject in the Review Queue" : "Inbox zero"} />
        <Stat label="Claude spend this month" value={formatUsd(spend.usd)} hint="From the in-app ledger" />
      </div>

      {due.length > 0 && (
        <section className="card mb-6 overflow-hidden fade-up">
          <div className="px-6 pt-5 pb-3"><h3 className="h-section">Follow-ups due <span className="t-caption">({due.length})</span></h3></div>
          <div className="table-wrap"><table className="table"><thead><tr><th>Lead</th><th>Company</th><th>Step</th><th>Due</th></tr></thead>
            <tbody>{due.map(({ p, company }) => <tr key={p.id}><td className="font-medium"><Link href={`/leads/${p.id}`} className="hover:text-accent">{p.fullName}</Link></td><td>{company}</td><td>Email {p.nextStep}</td><td className={p.nextStepDue! < today ? "text-danger font-medium" : ""}>{p.nextStepDue}</td></tr>)}</tbody></table></div>
        </section>
      )}

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="card lg:col-span-3 fade-up">
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <h3 className="h-section">Campaigns</h3>
            <Link href="/campaigns/new" className="btn btn-ghost btn-sm">New campaign <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          {recentCampaigns.length === 0 ? (
            <div className="px-6 pb-8 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-accent-soft text-accent flex items-center justify-center"><Megaphone className="h-4 w-4" /></div>
              <div>
                <div className="text-[15px] font-medium">No campaigns yet</div>
                <div className="t-caption">Create one and Claude will draft the ICP, signals and sequence.</div>
              </div>
            </div>
          ) : (
            <div className="table-wrap"><table className="table">
              <thead><tr><th>Name</th><th>Target</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {recentCampaigns.map((c) => (
                  <tr key={c.id}>
                    <td className="font-medium"><Link href={`/campaigns/${c.id}`}>{c.name}</Link></td>
                    <td className="t-caption">{[nicheLabel(c.niche ?? "", c.subNiche), c.targetCity ?? countryName(c.targetCountry)].filter(Boolean).join(" → ")}</td>
                    <td><Pill tone={statusTone(c.status)}>{c.status}</Pill></td>
                    <td className="t-caption text-right">{timeAgo(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </div>
        <div className="card lg:col-span-2 fade-up">
          <div className="px-6 pt-5 pb-3"><h3 className="h-section">Recent Claude jobs</h3></div>
          {recentRuns.length === 0 ? <p className="px-6 pb-8 t-caption">Nothing has run yet.</p> : (
            <ul className="divide-y divide-line">
              {recentRuns.map((r) => (
                <li key={r.id} className="px-6 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[14px] font-medium">{r.jobType.replace("_", " ")}</div>
                    <div className="t-caption truncate">{r.model} · {r.mode}{r.error ? ` · ${r.error}` : ""}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <Pill tone={r.status === "succeeded" ? "success" : r.status === "failed" ? "danger" : "warning"}>{r.status}</Pill>
                    <div className="t-caption mt-1">{formatUsd(r.costUsd, 4)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="mt-6 t-caption">Tier legend: <Pill tone={tierTone("A")}>A</Pill> call now · <Pill tone={tierTone("B")}>B</Pill> nurture or research · <Pill tone={tierTone("C")}>C</Pill> monitor · <Pill tone={tierTone("DQ")}>DQ</Pill> archive</div>
    </>
  );
}
