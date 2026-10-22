import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { FormRow, Input, Label, Select, Textarea } from "@/components/ui/field";
import { createCampaign } from "@/server/actions/campaigns";
import { PERSONAS, CORRIDORS, OFFERS } from "@/lib/options";

export default function NewCampaignPage() {
  return (
    <>
      <PageHeader title="New campaign" description="Three choices and a few notes. Claude turns them into a full plan you can edit." />
      <form action={createCampaign} className="card p-8 max-w-3xl space-y-6 fade-up">
        <div>
          <Label htmlFor="name">Campaign name</Label>
          <Input id="name" name="name" required placeholder="Indian D2C brands → UAE, Q4 2026" />
        </div>
        <FormRow>
          <div>
            <Label htmlFor="persona" hint="Who you are selling to">Persona</Label>
            <Select id="persona" name="persona" defaultValue="A">{PERSONAS.map((p) => <option key={p.value} value={p.value}>{p.value}: {p.label}</option>)}</Select>
          </div>
          <div>
            <Label htmlFor="corridor" hint="Origin → destination market">Corridor</Label>
            <Select id="corridor" name="corridor" defaultValue="IN->AE">{CORRIDORS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</Select>
          </div>
        </FormRow>
        <div>
          <Label htmlFor="offer" hint="The primary thing this campaign leads with">Offer</Label>
          <Select id="offer" name="offer" defaultValue="OFF-3">{OFFERS.map((o) => <option key={o.value} value={o.value}>{o.value}: {o.label}</option>)}</Select>
        </div>
        <div>
          <Label htmlFor="goal">Goal</Label>
          <Input id="goal" name="goal" placeholder="Book 8 discovery calls by end of quarter" />
        </div>
        <div>
          <Label htmlFor="notes" hint="Anything Claude should know: what you've seen in this market, a recent client, an angle to avoid">Notes for the strategist</Label>
          <Textarea id="notes" name="notes" placeholder="Snitch went to the UAE via Noon in Feb 2026. Non-diaspora shoppers are the angle. Avoid price in the first touch." />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="submit">Create and generate plan</Button>
        </div>
      </form>
    </>
  );
}
