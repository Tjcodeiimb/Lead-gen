"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { deleteDemoData, setSetting } from "@/server/actions/settings";

export function DemoDataButton() {
  const [pending, start] = useTransition();
  return (
    <Button variant="secondary" size="sm" loading={pending} onClick={() => {
      if (!confirm("Delete the demo campaign and the three fictional leads? Your real data stays.")) return;
      start(async () => { const r = await deleteDemoData(); toast.success(`Removed ${r.people} demo leads, ${r.companies} companies, ${r.campaigns} campaign`); });
    }}>Delete demo data</Button>
  );
}

export function SettingsForm({ pauseLlm, budget }: { pauseLlm: boolean; budget: number }) {
  const [paused, setPaused] = useState(pauseLlm);
  const [limit, setLimit] = useState(String(budget));
  const [pending, start] = useTransition();
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><div className="text-[14px] font-medium">Pause all Claude jobs</div><div className="t-caption">Kill switch. Nothing will be generated while this is on.</div></div>
        <button type="button" role="switch" aria-checked={paused} onClick={() => start(async () => { const v = !paused; setPaused(v); await setSetting("pause_llm", v); toast.success(v ? "Paused" : "Resumed"); })}
          className={`relative h-7 w-12 rounded-full transition ${paused ? "bg-danger" : "bg-line-strong"}`}>
          <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${paused ? "left-[22px]" : "left-0.5"}`} />
        </button>
      </div>
      <div>
        <Label htmlFor="budget" hint="Jobs stop when the in-app ledger reaches this. Set 0 for no limit.">Monthly Claude budget (USD)</Label>
        <div className="flex gap-2"><Input id="budget" type="number" min={0} value={limit} onChange={(e) => setLimit(e.target.value)} /><Button variant="secondary" loading={pending} onClick={() => start(async () => { await setSetting("monthly_budget_usd", Number(limit)); toast.success("Budget saved"); })}>Save</Button></div>
      </div>
    </div>
  );
}
