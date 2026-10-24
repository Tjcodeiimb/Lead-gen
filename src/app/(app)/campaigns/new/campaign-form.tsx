"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormRow, Input, Label, Select, Textarea } from "@/components/ui/field";
import { createCampaign } from "@/server/actions/campaigns";
import { COMPANY_SIZES, COUNTRIES, NICHES, ROLE_GROUPS } from "@/lib/targeting";
import { OFFERS, PERSONAS } from "@/lib/options";
import { cn } from "@/lib/utils";

function Chips({ name, options, defaults = [] }: { name: string; options: { value: string; label: string }[]; defaults?: string[] }) {
  const [sel, setSel] = useState<string[]>(defaults);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = sel.includes(o.value);
        return (
          <button key={o.value} type="button" onClick={() => setSel(on ? sel.filter((v) => v !== o.value) : [...sel, o.value])}
            className={cn("pill !py-1.5 !px-3 !text-[13px] cursor-pointer transition", on ? "pill-accent" : "hover:border-line-strong")}>{o.label}</button>
        );
      })}
      {sel.map((v) => <input key={v} type="hidden" name={name} value={v} />)}
    </div>
  );
}

function CityPicker({ countryName, cityName, label, hint, defaultCountry }: { countryName: string; cityName: string; label: string; hint: string; defaultCountry: string }) {
  const [country, setCountry] = useState(defaultCountry);
  const cities = COUNTRIES.find((c) => c.code === country)?.cities ?? [];
  return (
    <div>
      <Label hint={hint}>{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        <Select name={countryName} value={country} onChange={(e) => setCountry(e.target.value)}>
          <option value="">Any country</option>
          {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
        </Select>
        <Select name={cityName} defaultValue="" disabled={!country}>
          <option value="">Any city</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </div>
    </div>
  );
}

export function CampaignForm() {
  const [niche, setNiche] = useState(NICHES[0].value);
  const subs = NICHES.find((n) => n.value === niche)?.sub ?? [];
  return (
    <form action={createCampaign} className="card p-6 sm:p-8 max-w-3xl space-y-7 fade-up">
      <div>
        <Label htmlFor="name">Campaign name</Label>
        <Input id="name" name="name" required placeholder="D2C beauty, Mumbai → Dubai, Q4" />
      </div>

      <FormRow>
        <div>
          <Label htmlFor="niche">Niche</Label>
          <Select id="niche" name="niche" value={niche} onChange={(e) => setNiche(e.target.value)}>{NICHES.map((n) => <option key={n.value} value={n.value}>{n.label}</option>)}</Select>
        </div>
        <div>
          <Label htmlFor="subNiche">Sub-niche</Label>
          <Select id="subNiche" name="subNiche" defaultValue=""><option value="">Any</option>{subs.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}</Select>
        </div>
      </FormRow>

      <FormRow>
        <CityPicker countryName="companyCountry" cityName="companyCity" label="Where the companies are based" hint="Their headquarters" defaultCountry="IN" />
        <CityPicker countryName="targetCountry" cityName="targetCity" label="Market they are entering" hint="Where you'll help them go" defaultCountry="AE" />
      </FormRow>

      <div>
        <Label hint="Pick as many as apply">Company size (employees)</Label>
        <Chips name="companySizes" options={COMPANY_SIZES} defaults={["51,200", "201,500"]} />
      </div>

      <div>
        <Label hint="Who you want to talk to">Roles to reach</Label>
        <Chips name="roles" options={ROLE_GROUPS} defaults={["founder_ceo", "international"]} />
      </div>

      <div>
        <Label htmlFor="keywords" hint="Optional, comma-separated. Narrows the search.">Extra keywords</Label>
        <Input id="keywords" name="keywords" placeholder="ayurvedic, clean beauty, Noon" />
      </div>

      <FormRow>
        <div>
          <Label htmlFor="persona" hint="Shapes the tone of the plan">Buyer persona</Label>
          <Select id="persona" name="persona" defaultValue="A">{PERSONAS.map((p) => <option key={p.value} value={p.value}>{p.value}: {p.label}</option>)}</Select>
        </div>
        <div>
          <Label htmlFor="offer" hint="What this campaign leads with">Offer</Label>
          <Select id="offer" name="offer" defaultValue="OFF-3">{OFFERS.map((o) => <option key={o.value} value={o.value}>{o.value}: {o.label}</option>)}</Select>
        </div>
      </FormRow>

      <div>
        <Label htmlFor="goal">Goal</Label>
        <Input id="goal" name="goal" placeholder="Book 8 discovery calls by end of quarter" />
      </div>
      <div>
        <Label htmlFor="notes" hint="Anything the strategist should know">Notes</Label>
        <Textarea id="notes" name="notes" placeholder="Non-diaspora shoppers are the angle. Avoid price in the first touch." />
      </div>

      <div className="flex justify-end"><Button type="submit">Create and generate plan</Button></div>
    </form>
  );
}
