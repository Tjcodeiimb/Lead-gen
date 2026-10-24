"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Pill } from "@/components/ui/pill";
import { saveIntegrationKey, setProviderLimit, testClaude } from "@/server/actions/settings";
import { cn } from "@/lib/utils";

type Def = { key: string; label: string; help: string; link: string; steps: string[]; unit?: string };
type Status = { set: boolean; fromEnv: boolean; last4: string };
type Usage = { used: number; limit: number | null; exhausted: boolean } | undefined;

export function KeyCard({ def, status, usage, testable, compact }: { def: Def; status: Status; usage?: Usage; testable?: boolean; compact?: boolean }) {
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(!status.set && !compact);
  const [limit, setLimit] = useState(usage?.limit?.toString() ?? "");
  const [pending, start] = useTransition();
  const [testing, startTest] = useTransition();
  const router = useRouter();
  const pct = usage?.limit ? Math.min(100, Math.round((usage.used / usage.limit) * 100)) : null;

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[15px] font-semibold">{def.label}</div>
          {!compact && <p className="t-caption mt-0.5">{def.help}</p>}
        </div>
        <Pill tone={status.set ? (usage?.exhausted ? "warning" : "success") : "neutral"}>{status.set ? (status.fromEnv ? "set in Vercel" : `set · …${status.last4}`) : "not set"}</Pill>
      </div>

      {usage && status.set && (
        <div className="mt-3">
          <div className="flex justify-between t-caption mb-1"><span>This month</span><span>{usage.used}{usage.limit ? ` / ${usage.limit}` : ""} {def.unit ?? ""}{usage.exhausted ? " · limit reached, auto-switched" : ""}</span></div>
          {pct !== null && <div className="h-1.5 rounded-full bg-line overflow-hidden"><div className={cn("h-full rounded-full", pct >= 100 ? "bg-danger" : pct >= 80 ? "bg-warning" : "bg-accent")} style={{ width: `${pct}%` }} /></div>}
        </div>
      )}

      {!status.fromEnv && (
        <form className="flex gap-2 mt-4" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await saveIntegrationKey(def.key, value); if (r.ok) { toast.success(`${def.label} saved`); setValue(""); router.refresh(); } else toast.error(r.error); }); }}>
          <Input type="password" placeholder={status.set ? "Paste a new key to replace" : "Paste key"} value={value} onChange={(e) => setValue(e.target.value)} className="!py-2" autoComplete="off" />
          <Button type="submit" size="sm" variant={testable ? "ghost" : "secondary"} loading={pending} disabled={!value.trim()}>{testable ? "Save without testing" : "Save"}</Button>
          {testable && <Button type="button" size="sm" loading={testing} disabled={!value.trim() && !status.set} onClick={() => startTest(async () => {
            const typed = value.trim();
            const r = await testClaude(typed || undefined);
            if (!r.ok) { toast.error(r.error); return; }
            if (typed) { const saved = await saveIntegrationKey(def.key, typed); if (!saved.ok) { toast.error(saved.error); return; } setValue(""); router.refresh(); }
            toast.success(typed ? `Key works and is saved (${r.model})` : `Saved key works (${r.model})`);
          })}>Test and save</Button>}
        </form>
      )}

      {usage && status.set && usage.limit !== null && (
        <form className="flex items-center gap-2 mt-3 t-caption" onSubmit={(e) => { e.preventDefault(); start(async () => { await setProviderLimit(def.key, Number(limit)); toast.success("Limit saved"); router.refresh(); }); }}>
          <span>Monthly limit on my plan:</span>
          <Input type="number" min={0} value={limit} onChange={(e) => setLimit(e.target.value)} className="!py-1 !w-24 !text-[13px]" />
          <Button type="submit" size="sm" variant="ghost" loading={pending}>Save</Button>
        </form>
      )}

      {def.steps.length > 0 && (
        <div className="mt-4">
          <button type="button" onClick={() => setOpen(!open)} className="flex items-center gap-1 text-[13px] font-medium text-accent">
            <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} /> How to get this key
          </button>
          {open && (
            <ol className="mt-2 space-y-1.5 list-decimal pl-5 t-caption">
              {def.steps.map((s, i) => <li key={i}>{s}</li>)}
              <li><a href={def.link} target="_blank" rel="noreferrer" className="text-accent inline-flex items-center gap-1">Open the provider&apos;s page <ExternalLink className="h-3 w-3" /></a></li>
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
