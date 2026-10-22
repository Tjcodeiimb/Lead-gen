"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormRow, Input, Label, Select } from "@/components/ui/field";
import { importLeadsCsv } from "@/server/actions/leads";

export function ImportForm({ campaigns, defaultCampaignId }: { campaigns: { id: string; name: string }[]; defaultCampaignId?: string }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await importLeadsCsv(fd);
      if (!res.ok) { toast.error(res.error); return; }
      setResult(`Imported ${res.inserted} leads. Skipped ${res.skipped} (missing name/company or duplicate). ${res.suppressed} on the suppression list.`);
      toast.success(`Imported ${res.inserted} leads`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="card p-8 max-w-3xl space-y-6 fade-up">
      <div>
        <Label htmlFor="file">CSV file</Label>
        <input id="file" name="file" type="file" accept=".csv,text/csv" required className="block w-full text-[14px] file:mr-4 file:btn file:btn-secondary file:btn-sm" />
      </div>
      <FormRow>
        <div>
          <Label htmlFor="campaignId" hint="Optional">Campaign</Label>
          <Select id="campaignId" name="campaignId" defaultValue={defaultCampaignId ?? ""}>
            <option value="">No campaign</option>
            {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
        <div>
          <Label htmlFor="lawfulBasis" hint="How you are allowed to contact these people">Lawful basis</Label>
          <Select id="lawfulBasis" name="lawfulBasis" defaultValue="legitimate_interest">
            <option value="legitimate_interest">Legitimate interest (B2B, role-relevant)</option>
            <option value="consent">Consent captured</option>
            <option value="existing_customer">Existing customer</option>
            <option value="unknown">Unknown (blocks sending)</option>
          </Select>
        </div>
      </FormRow>
      <FormRow>
        <div>
          <Label htmlFor="source">Source</Label>
          <Select id="source" name="source" defaultValue="csv">
            <option value="csv">Spreadsheet</option>
            <option value="apollo">Apollo export</option>
            <option value="sales_navigator_manual">Sales Navigator (manual)</option>
            <option value="event">Event / exhibitor list</option>
            <option value="referral">Referral</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="sourceDescription" hint="Shown in the privacy notice, e.g. “Gulfood 2026 exhibitor list”">Where did this list come from?</Label>
          <Input id="sourceDescription" name="sourceDescription" required placeholder="Apollo search: Country Manager UAE, Oct 2026" />
        </div>
      </FormRow>
      {result && <p className="pill pill-success">{result}</p>}
      <div className="flex justify-end"><Button type="submit" loading={pending}>Import</Button></div>
    </form>
  );
}
