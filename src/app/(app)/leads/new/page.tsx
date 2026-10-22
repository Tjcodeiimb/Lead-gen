import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { campaigns } from "@/db/schema";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { FormRow, Input, Label, Select, Textarea } from "@/components/ui/field";
import { createLead } from "@/server/actions/leads";

export default async function NewLeadPage() {
  const cs = await db.select({ id: campaigns.id, name: campaigns.name }).from(campaigns).orderBy(desc(campaigns.createdAt));
  return (
    <>
      <PageHeader title="Add a lead" description="Useful for someone you met at an event or found on LinkedIn (copy the URL by hand; never scrape)." />
      <form action={createLead} className="card p-8 max-w-3xl space-y-6 fade-up">
        <FormRow>
          <div><Label htmlFor="fullName">Full name</Label><Input id="fullName" name="fullName" required /></div>
          <div><Label htmlFor="title">Title</Label><Input id="title" name="title" placeholder="Founder & CEO" /></div>
        </FormRow>
        <FormRow>
          <div><Label htmlFor="company">Company</Label><Input id="company" name="company" required /></div>
          <div><Label htmlFor="domain">Company website</Label><Input id="domain" name="domain" placeholder="brand.com" /></div>
        </FormRow>
        <FormRow>
          <div><Label htmlFor="email">Work email</Label><Input id="email" name="email" type="email" /></div>
          <div><Label htmlFor="linkedinUrl">LinkedIn URL</Label><Input id="linkedinUrl" name="linkedinUrl" placeholder="https://linkedin.com/in/…" /></div>
        </FormRow>
        <FormRow>
          <div><Label htmlFor="country" hint="Two-letter code">Person country</Label><Input id="country" name="country" maxLength={2} placeholder="IN" /></div>
          <div><Label htmlFor="hqCountry" hint="Two-letter code">Company HQ country</Label><Input id="hqCountry" name="hqCountry" maxLength={2} placeholder="IN" /></div>
        </FormRow>
        <FormRow>
          <div><Label htmlFor="campaignId">Campaign</Label><Select id="campaignId" name="campaignId" defaultValue=""><option value="">No campaign</option>{cs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></div>
          <div><Label htmlFor="sourceDescription">Where did you find them?</Label><Input id="sourceDescription" name="sourceDescription" placeholder="Met at UKIBC event, Oct 2026" /></div>
        </FormRow>
        <div><Label htmlFor="notes">Notes</Label><Textarea id="notes" name="notes" placeholder="Mentioned a UK launch in Q1." /></div>
        <div className="flex justify-end"><Button type="submit">Save lead</Button></div>
      </form>
    </>
  );
}
