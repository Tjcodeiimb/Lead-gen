"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runCopy, runPipeline, runQualify, suppressLead } from "@/server/actions/leads";
import { markSent } from "@/server/actions/review";

type Job = "pipeline" | "qualify" | "copy" | null;

const STAGES: Record<Exclude<Job, null>, { after: number; text: string }[]> = {
  pipeline: [
    { after: 0, text: "Searching the web for this company…" },
    { after: 45, text: "Reading sources and building the evidence ledger…" },
    { after: 80, text: "Scoring against the 8-criterion rubric…" },
    { after: 110, text: "Writing the email, follow-up and LinkedIn note…" },
    { after: 180, text: "Still working. Long research runs can take up to 4 minutes." },
  ],
  qualify: [
    { after: 0, text: "Searching the web for this company…" },
    { after: 60, text: "Scoring against the 8-criterion rubric…" },
  ],
  copy: [{ after: 0, text: "Writing the email, follow-up and LinkedIn note…" }],
};

export function LeadActions({ id, status, tier, doNotContact }: { id: string; status: string; tier: string | null; doNotContact: boolean }) {
  const [pending, start] = useTransition();
  const [job, setJob] = useState<Job>(null);
  const [elapsed, setElapsed] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (!job) return;
    const t0 = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [job]);

  function run(kind: Exclude<Job, null>, fn: () => Promise<void>) {
    setElapsed(0);
    setJob(kind);
    start(async () => {
      try { await fn(); } finally { setJob(null); }
    });
  }

  const stage = job ? [...STAGES[job]].reverse().find((s) => elapsed >= s.after)?.text : null;
  const busy = pending || status === "qualifying" || status === "researching";

  return (
    <section className="card p-6 space-y-3">
      <h3 className="h-section">Actions</h3>
      {doNotContact ? <p className="pill pill-danger">Suppressed. This lead cannot be contacted.</p> : (
        <>
          <Button className="w-full" loading={busy} disabled={busy} onClick={() => run("pipeline", async () => {
            const r = await runPipeline(id);
            if (r.ok) { toast.success(`Tier ${r.tier}${r.copied ? " · drafts queued for review" : ""}`); router.refresh(); } else toast.error(r.error);
          })}><Sparkles className="h-4 w-4" /> Research, qualify and draft</Button>

          {job && (
            <div className="rounded-xl bg-accent-soft px-4 py-3 fade-up">
              <div className="text-[13px] font-medium text-ink">{stage}</div>
              <div className="t-caption mt-0.5">{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")} elapsed · usually 1 to 3 minutes · keep this tab open</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" size="sm" disabled={busy} onClick={() => run("qualify", async () => { const r = await runQualify(id); if (r.ok) { toast.success(`Scored ${r.total} · Tier ${r.tier}`); router.refresh(); } else toast.error(r.error); })}>Qualify only</Button>
            <Button variant="secondary" size="sm" disabled={busy || !tier || tier === "DQ"} onClick={() => run("copy", async () => { const r = await runCopy(id); if (r.ok) { toast.success("Drafts written"); router.refresh(); } else toast.error(r.error); })}><Wand2 className="h-3.5 w-3.5" /> Draft copy</Button>
          </div>
          {status === "approved" && (
            <Button variant="secondary" className="w-full" disabled={busy} onClick={() => start(async () => { await markSent(id); toast.success("Marked as sent"); router.refresh(); })}>I&apos;ve sent the first email</Button>
          )}
          <Button variant="ghost" size="sm" className="w-full !text-danger" disabled={busy} onClick={() => { if (confirm("Add this person to the permanent suppression list?")) start(async () => { await suppressLead(id, "manual"); toast.success("Suppressed"); router.refresh(); }); }}><Ban className="h-3.5 w-3.5" /> Suppress</Button>
        </>
      )}
      <p className="t-caption">Research uses up to 5 web searches per company and is reused for 30 days. Cost is about $0.40 per lead.</p>
    </section>
  );
}
