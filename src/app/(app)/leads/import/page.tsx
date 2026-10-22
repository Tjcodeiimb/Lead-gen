import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { campaigns } from "@/db/schema";
import { PageHeader } from "@/components/app/page-header";
import { ImportForm } from "./import-form";

export default async function ImportPage({ searchParams }: PageProps<"/leads/import">) {
  const sp = await searchParams;
  const cs = await db.select({ id: campaigns.id, name: campaigns.name }).from(campaigns).orderBy(desc(campaigns.createdAt));
  return (
    <>
      <PageHeader title="Import leads" description="A CSV with at least a name and a company. We match common column names (first_name, last_name, email, title, company, domain, country, linkedin) automatically." />
      <ImportForm campaigns={cs} defaultCampaignId={typeof sp.campaignId === "string" ? sp.campaignId : undefined} />
    </>
  );
}
