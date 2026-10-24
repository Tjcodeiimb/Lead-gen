import { desc, gte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { agentRuns, auditLog, settings } from "@/db/schema";
import { PageHeader } from "@/components/app/page-header";
import { env } from "@/lib/env";
import { Pill } from "@/components/ui/pill";
import { formatUsd, timeAgo } from "@/lib/utils";
import { DemoDataButton, SettingsForm } from "./form";
import { PasswordForm } from "./password-form";

export default async function SettingsPage() {
  const rows = await db.select().from(settings);
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const monthStart = new Date(); monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0);
  const [spend] = await db.select({ usd: sql<string>`coalesce(sum(${agentRuns.costUsd}),0)`, n: sql<number>`count(*)` }).from(agentRuns).where(gte(agentRuns.createdAt, monthStart));
  const audit = await db.select().from(auditLog).orderBy(desc(auditLog.at)).limit(20);

  return (
    <>
      <PageHeader title="Settings" description="Kill switches, budget and the audit trail." />
      <div className="grid lg:grid-cols-2 gap-6 fade-up">
        <div className="space-y-6">
          <section className="card p-6">
            <h3 className="h-section mb-1">Claude</h3>
            <p className="t-caption mb-4">Mode: <Pill tone={env.claudeMode === "live" ? "success" : "warning"}>{env.claudeMode}</Pill> · This month: {formatUsd(spend.usd)} across {spend.n} jobs</p>
            <SettingsForm pauseLlm={map.pause_llm === true} budget={Number(map.monthly_budget_usd ?? 150)} />
          </section>
          <section className="card p-6">
            <h3 className="h-section mb-4">Password</h3>
            <PasswordForm />
          </section>
          <section className="card p-6">
            <h3 className="h-section mb-1">Demo data</h3>
            <p className="t-caption mb-3">The seed script added one demo campaign and three fictional leads so the screens weren&apos;t empty. Remove them when you&apos;re ready for real data.</p>
            <DemoDataButton />
          </section>
          <section className="card p-6">
            <h3 className="h-section mb-2">Knowledge base</h3>
            <p className="t-caption">Claude reads the files in <code className="t-mono">/kb</code> on every call: offers, voice, compliance, corridor facts, case studies. Edit them in the repo and redeploy. <strong className="text-ink">Prices in offers.md are unconfirmed</strong>, so copy says “fixed fee” until you confirm them.</p>
          </section>
        </div>
        <section className="card overflow-hidden">
          <div className="px-6 pt-5 pb-3"><h3 className="h-section">Audit log</h3></div>
          <ul className="divide-y divide-line">
            {audit.length === 0 && <li className="px-6 pb-6 t-caption">Nothing yet.</li>}
            {audit.map((a) => <li key={a.id} className="px-6 py-3 flex justify-between gap-3 text-[13px]"><span><span className="font-medium">{a.action}</span> <span className="text-ink-2">by {a.actor}</span></span><span className="t-caption shrink-0">{timeAgo(a.at)}</span></li>)}
          </ul>
        </section>
      </div>
    </>
  );
}
