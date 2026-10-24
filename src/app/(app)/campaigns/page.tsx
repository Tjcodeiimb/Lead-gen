import Link from "next/link";
import { desc, eq, count } from "drizzle-orm";
import { Megaphone, Plus } from "lucide-react";
import { db } from "@/db/client";
import { campaigns, people } from "@/db/schema";
import { PageHeader } from "@/components/app/page-header";
import { Empty } from "@/components/ui/empty";
import { Pill, statusTone } from "@/components/ui/pill";
import { timeAgo } from "@/lib/utils";
import { RowLink } from "@/components/app/row-link";

export default async function CampaignsPage() {
  const rows = await db.select({ c: campaigns, leads: count(people.id) }).from(campaigns)
    .leftJoin(people, eq(people.campaignId, campaigns.id)).groupBy(campaigns.id).orderBy(desc(campaigns.createdAt));
  return (
    <>
      <PageHeader title="Campaigns" description="A campaign is one persona, one corridor and one offer, with the signals that find them and the sequence that reaches them."
        action={<Link href="/campaigns/new" className="btn btn-primary"><Plus className="h-4 w-4" /> New campaign</Link>} />
      <div className="card overflow-hidden fade-up">
        {rows.length === 0 ? (
          <Empty icon={Megaphone} title="No campaigns yet" description="Start with the persona you can reach fastest. Claude drafts the rest." action={<Link href="/campaigns/new" className="btn btn-primary">Create your first campaign</Link>} />
        ) : (
          <div className="table-wrap"><table className="table">
            <thead><tr><th>Name</th><th>Persona</th><th>Corridor</th><th>Offer</th><th>Leads</th><th>Status</th><th>Created</th></tr></thead>
            <tbody>
              {rows.map(({ c, leads }) => (
                <RowLink key={c.id} href={`/campaigns/${c.id}`}>
                  <td className="font-medium"><Link href={`/campaigns/${c.id}`} className="hover:text-accent">{c.name}</Link></td>
                  <td>{c.persona}</td><td className="t-mono">{c.corridor}</td><td className="t-mono">{c.offer}</td>
                  <td>{leads}</td><td><Pill tone={statusTone(c.status)}>{c.status}</Pill></td>
                  <td className="t-caption">{timeAgo(c.createdAt)}</td>
                </RowLink>
              ))}
            </tbody>
          </table></div>
        )}
      </div>
    </>
  );
}
