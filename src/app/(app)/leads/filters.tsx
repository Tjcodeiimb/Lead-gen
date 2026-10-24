"use client";
import { useRouter } from "next/navigation";
import { Input, Select } from "@/components/ui/field";

const TIERS = ["A", "B", "C", "DQ", "NEEDS_RESEARCH"];
const STATUSES = ["new", "qualified", "needs_research", "in_review", "approved", "sent", "replied", "meeting_booked", "nurture", "disqualified", "do_not_contact"];

export function LeadFilters({ q, tier, status, campaignId, campaigns, total }: { q: string; tier: string; status: string; campaignId: string; campaigns: { id: string; name: string }[]; total: number }) {
  const router = useRouter();
  function apply(next: Record<string, string>) {
    const params = new URLSearchParams();
    const merged = { q, tier, status, campaign: campaignId, ...next };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    router.push(`/leads?${params.toString()}`);
  }
  return (
    <form className="grid grid-cols-2 lg:grid-cols-[1fr_160px_180px_220px_auto] gap-2 mb-4 fade-up" onSubmit={(e) => { e.preventDefault(); apply({ q: (new FormData(e.currentTarget).get("q") as string) ?? "" }); }}>
      <Input name="q" defaultValue={q} placeholder="Search name, company or title" className="col-span-2 lg:col-span-1 !py-2.5" />
      <Select value={tier} onChange={(e) => apply({ tier: e.target.value })} className="!py-2.5"><option value="">All tiers</option>{TIERS.map((t) => <option key={t} value={t}>{t}</option>)}</Select>
      <Select value={status} onChange={(e) => apply({ status: e.target.value })} className="!py-2.5"><option value="">All statuses</option>{STATUSES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}</Select>
      <Select value={campaignId} onChange={(e) => apply({ campaign: e.target.value })} className="!py-2.5"><option value="">All campaigns</option>{campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select>
      <div className="t-caption self-center col-span-2 lg:col-span-1">{total} lead{total === 1 ? "" : "s"}</div>
    </form>
  );
}
