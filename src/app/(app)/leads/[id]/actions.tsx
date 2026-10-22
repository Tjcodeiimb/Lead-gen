"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Ban, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runCopy, runPipeline, runQualify, suppressLead } from "@/server/actions/leads";

export function LeadActions({ id, status, tier, doNotContact }: { id: string; status: string; tier: string | null; doNotContact: boolean }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const busy = status === "qualifying" || status === "researching";

  return (
    <section className="card p-6 space-y-3">
      <h3 className="h-section">Actions</h3>
      {doNotContact ? <p className="pill pill-danger">Suppressed. This lead cannot be contacted.</p> : (
        <>
          <Button className="w-full" loading={pending || busy} onClick={() => start(async () => {
            const r = await runPipeline(id);
            if (r.ok) { toast.success(`Tier ${r.tier}${r.copied ? " · drafts queued for review" : ""}`); router.refresh(); } else toast.error(r.error);
          })}><Sparkles className="h-4 w-4" /> Research, qualify and draft</Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" size="sm" loading={pending} onClick={() => start(async () => { const r = await runQualify(id); if (r.ok) { toast.success(`Scored ${r.total} · Tier ${r.tier}`); router.refresh(); } else toast.error(r.error); })}>Qualify only</Button>
            <Button variant="secondary" size="sm" loading={pending} disabled={!tier || tier === "DQ"} onClick={() => start(async () => { const r = await runCopy(id); if (r.ok) { toast.success("Drafts written"); router.refresh(); } else toast.error(r.error); })}><Wand2 className="h-3.5 w-3.5" /> Draft copy</Button>
          </div>
          <Button variant="ghost" size="sm" className="w-full !text-danger" onClick={() => { if (confirm("Add this person to the permanent suppression list?")) start(async () => { await suppressLead(id, "manual"); toast.success("Suppressed"); router.refresh(); }); }}><Ban className="h-3.5 w-3.5" /> Suppress</Button>
        </>
      )}
      <p className="t-caption">Research uses up to 5 web searches per company and is cached for 30 days.</p>
    </section>
  );
}
