"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Globe, Mail, Radar, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { cn, formatUsd, timeAgo } from "@/lib/utils";
import { dismissCandidates, findCandidateEmail, importCandidates, launchFinder, revealCandidate } from "@/server/actions/finders";
import type { candidates as candidatesTable, finderRuns as runsTable } from "@/db/schema";

type Candidate = typeof candidatesTable.$inferSelect;
type Run = typeof runsTable.$inferSelect;

const SOURCES: { id: "claude_web" | "apollo" | "signals"; label: string; blurb: string; icon: typeof Globe; needs?: "apollo" }[] = [
  { id: "claude_web", label: "Claude web research", blurb: "Searches the web for matching companies and the people who run them. About $0.10 to $0.30 a run.", icon: Globe },
  { id: "apollo", label: "Apollo search", blurb: "Finds people by title, location and company size. Free. Reveal full name and email for 1 credit each.", icon: Users, needs: "apollo" },
  { id: "signals", label: "Expansion signals", blurb: "Press, job posts and registry filings showing a move into the target market. Free sources first.", icon: Radar },
];

export function FindLeads({ campaignId, candidates, runs, counts, keys, mock }: {
  campaignId: string; candidates: Candidate[]; runs: Run[]; counts: { total: number; fresh: number; withPerson: number; withEmail: number };
  keys: { apollo: boolean; hunter: boolean; theirstack: boolean; companiesHouse: boolean }; mock: boolean;
}) {
  const router = useRouter();
  const [running, setRunning] = useState<string | null>(null);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [busyRow, setBusyRow] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function run(source: "claude_web" | "apollo" | "signals") {
    setRunning(source);
    start(async () => {
      const r = await launchFinder(campaignId, source);
      setRunning(null);
      if (r.ok) { toast.success(`${r.found} new candidate${r.found === 1 ? "" : "s"}${r.note ? ` · ${r.note}` : ""}`); router.refresh(); }
      else toast.error(r.error);
    });
  }
  function toggle(id: string) { setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; }); }
  const allIds = candidates.map((c) => c.id);
  const ready = candidates.filter((c) => c.fullName && !/•/.test(c.fullName));

  return (
    <div className="space-y-6 fade-up">
      {mock && <div className="card p-4 flex items-center gap-3"><Pill tone="warning">Mock mode</Pill><span className="t-caption">Finders return sample rows until a Claude key is set. Nothing is spent.</span></div>}

      <div className="grid md:grid-cols-3 gap-4">
        {SOURCES.map((s) => {
          const Icon = s.icon;
          const blocked = s.needs === "apollo" && !keys.apollo && !mock;
          return (
            <div key={s.id} className="card p-5 flex flex-col">
              <div className="flex items-center gap-2 mb-2"><div className="h-8 w-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center"><Icon className="h-4 w-4" /></div><div className="text-[15px] font-semibold">{s.label}</div></div>
              <p className="t-caption flex-1 mb-4">{s.blurb}</p>
              {blocked ? <Link href="/settings/integrations" className="btn btn-secondary btn-sm">Add Apollo key</Link>
                : <Button size="sm" loading={running === s.id} disabled={pending} onClick={() => run(s.id)}><Sparkles className="h-3.5 w-3.5" /> {running === s.id ? "Searching…" : "Run"}</Button>}
              {s.id === "signals" && !mock && <div className="t-caption mt-2">News: on · Jobs: {keys.theirstack ? "on" : "needs TheirStack key"} · UK registry: {keys.companiesHouse ? "on" : "needs key"}</div>}
            </div>
          );
        })}
      </div>

      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-4 pb-3">
          <div>
            <h3 className="h-section">Candidates <span className="t-caption">{counts.fresh} new · {counts.withPerson} with a person · {counts.withEmail} with email</span></h3>
            <p className="t-caption">Tick the ones you want, then import. Rows without a named person import as a company placeholder you can fill in later.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setSel(new Set(sel.size === allIds.length ? [] : allIds))}>{sel.size === allIds.length && allIds.length ? "Clear" : "Select all"}</Button>
            <Button size="sm" variant="ghost" onClick={() => setSel(new Set(ready.map((c) => c.id)))}>Select named ({ready.length})</Button>
            <Button size="sm" variant="secondary" disabled={!sel.size || pending} onClick={() => start(async () => { await dismissCandidates([...sel]); setSel(new Set()); toast("Dismissed"); router.refresh(); })}>Dismiss</Button>
            <Button size="sm" disabled={!sel.size} loading={pending && !running && !busyRow} onClick={() => start(async () => { const r = await importCandidates([...sel]); if (r.ok) { toast.success(`Imported ${r.imported} lead${r.imported === 1 ? "" : "s"}${r.skipped ? `, skipped ${r.skipped} (duplicate or suppressed)` : ""}`); setSel(new Set()); router.refresh(); } else toast.error(r.error); })}>Import {sel.size ? `(${sel.size})` : ""}</Button>
          </div>
        </div>
        {candidates.length === 0 ? <p className="px-5 pb-6 t-caption">Nothing found yet. Run a finder above.</p> : (
          <div className="table-wrap"><table className="table">
            <thead><tr><th className="w-8"></th><th>Company</th><th>Person</th><th>Email</th><th>Why</th><th>Source</th><th></th></tr></thead>
            <tbody>
              {candidates.map((c) => {
                const obfuscated = Boolean(c.fullName && /•/.test(c.fullName));
                return (
                  <tr key={c.id} className={cn(sel.has(c.id) && "bg-accent-soft/40")}>
                    <td><input type="checkbox" className="h-4 w-4 accent-[var(--accent)]" checked={sel.has(c.id)} onChange={() => toggle(c.id)} /></td>
                    <td><div className="font-medium">{c.companyName}</div><div className="t-caption">{[c.domain, c.companyCity, c.companyCountry].filter(Boolean).join(" · ")}</div></td>
                    <td>{c.fullName ? <><div className={cn("text-[14px]", obfuscated && "text-ink-2")}>{c.fullName}</div><div className="t-caption">{c.title}</div></> : <span className="t-caption">no person yet</span>}</td>
                    <td className="t-caption">{c.email ? <span className="text-ink">{c.email} <Pill tone={c.emailStatus === "valid" ? "success" : "neutral"}>{c.emailStatus.replace(/_/g, " ")}</Pill></span> : "—"}</td>
                    <td className="t-caption max-w-[280px]">{c.signal}{c.signalUrl && <> <a href={c.signalUrl} target="_blank" rel="noreferrer" className="text-accent">source</a></>}</td>
                    <td><Pill>{c.source.replace("_", " ")}</Pill></td>
                    <td className="whitespace-nowrap">
                      {c.source === "apollo" && !c.email && <Button size="sm" variant="ghost" loading={busyRow === c.id} onClick={() => { setBusyRow(c.id); start(async () => { const r = await revealCandidate(c.id); setBusyRow(null); if (r.ok) { toast.success("Revealed (1 credit)"); router.refresh(); } else toast.error(r.error); }); }}>Reveal</Button>}
                      {c.source !== "apollo" && c.fullName && !c.email && (keys.hunter || mock) && <Button size="sm" variant="ghost" loading={busyRow === c.id} onClick={() => { setBusyRow(c.id); start(async () => { const r = await findCandidateEmail(c.id); setBusyRow(null); if (r.ok) { toast.success(r.email ? `Found ${r.email}` : "No email found"); router.refresh(); } else toast.error(r.error); }); }}><Mail className="h-3.5 w-3.5" /> Find email</Button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        )}
      </section>

      {runs.length > 0 && (
        <section className="card p-5">
          <h3 className="h-section mb-3">Recent runs</h3>
          <ul className="divide-y divide-line">{runs.map((r) => (
            <li key={r.id} className="py-2 flex items-center justify-between gap-3 text-[13px]">
              <div><span className="font-medium">{r.source.replace("_", " ")}</span> <span className="t-caption">{r.log ?? r.error ?? ""}</span></div>
              <div className="flex items-center gap-2 shrink-0"><Pill tone={r.status === "succeeded" ? "success" : r.status === "failed" ? "danger" : "warning"}>{r.status}</Pill><span className="t-caption">{r.found} new · {formatUsd(r.costUsd, 2)} · {timeAgo(r.startedAt)}</span></div>
            </li>))}</ul>
        </section>
      )}
    </div>
  );
}
