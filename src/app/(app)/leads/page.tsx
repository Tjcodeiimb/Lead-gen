import Link from "next/link";
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { Plus, Upload, Users } from "lucide-react";
import { db } from "@/db/client";
import { campaigns, companies, people } from "@/db/schema";
import { PageHeader } from "@/components/app/page-header";
import { Empty } from "@/components/ui/empty";
import { Pill, statusTone, tierTone } from "@/components/ui/pill";
import { timeAgo } from "@/lib/utils";
import { RowLink } from "@/components/app/row-link";
import { LeadFilters } from "./filters";

const PAGE = 50;

export default async function LeadsPage({ searchParams }: PageProps<"/leads">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const tier = typeof sp.tier === "string" ? sp.tier : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  const campaignId = typeof sp.campaign === "string" ? sp.campaign : "";
  const page = Math.max(1, Number(sp.page ?? 1) || 1);

  const where = and(
    q ? or(ilike(people.fullName, `%${q}%`), ilike(companies.name, `%${q}%`), ilike(people.title, `%${q}%`)) : undefined,
    tier ? sql`${people.tier} = ${tier}` : undefined,
    status ? sql`${people.status} = ${status}` : undefined,
    campaignId ? eq(people.campaignId, campaignId) : undefined,
  );

  const [rows, [{ total }], cs] = await Promise.all([
    db.select({ p: people, company: companies.name }).from(people).leftJoin(companies, eq(companies.id, people.companyId))
      .where(where).orderBy(desc(people.createdAt)).limit(PAGE).offset((page - 1) * PAGE),
    db.select({ total: count() }).from(people).leftJoin(companies, eq(companies.id, people.companyId)).where(where),
    db.select({ id: campaigns.id, name: campaigns.name }).from(campaigns).orderBy(desc(campaigns.createdAt)),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const hasFilters = Boolean(q || tier || status || campaignId);

  return (
    <>
      <PageHeader title="Leads" description="Every person you might contact, with their tier and where they are in the pipeline."
        action={<div className="flex gap-2"><Link href="/leads/new" className="btn btn-secondary"><Plus className="h-4 w-4" /> Add lead</Link><Link href="/leads/import" className="btn btn-primary"><Upload className="h-4 w-4" /> Import CSV</Link></div>} />
      <LeadFilters q={q} tier={tier} status={status} campaignId={campaignId} campaigns={cs} total={total} />
      <div className="card overflow-hidden fade-up">
        {rows.length === 0 ? (
          hasFilters
            ? <Empty icon={Users} title="No leads match" description="Try clearing a filter." action={<Link href="/leads" className="btn btn-secondary">Clear filters</Link>} />
            : <Empty icon={Users} title="No leads yet" description="Find leads from a campaign, import a CSV, or add one by hand." action={<Link href="/campaigns" className="btn btn-primary">Go to campaigns</Link>} />
        ) : (
          <div className="table-wrap"><table className="table">
            <thead><tr><th>Name</th><th>Company</th><th>Title</th><th>Tier</th><th>Score</th><th>Status</th><th>Added</th></tr></thead>
            <tbody>
              {rows.map(({ p, company }) => (
                <RowLink key={p.id} href={`/leads/${p.id}`}>
                  <td className="font-medium">{p.fullName}</td>
                  <td>{company}</td><td className="t-caption">{p.title}</td>
                  <td>{p.tier && <Pill tone={tierTone(p.tier)}>{p.tier}</Pill>}</td>
                  <td>{p.score ?? ""}</td>
                  <td><Pill tone={statusTone(p.status)}>{p.status.replace(/_/g, " ")}</Pill></td>
                  <td className="t-caption">{timeAgo(p.createdAt)}</td>
                </RowLink>
              ))}
            </tbody>
          </table></div>
        )}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-line t-caption">
            <span>Page {page} of {pages}</span>
            <div className="flex gap-2">
              {page > 1 && <Link className="btn btn-secondary btn-sm" href={{ pathname: "/leads", query: { ...sp, page: page - 1 } }}>Previous</Link>}
              {page < pages && <Link className="btn btn-secondary btn-sm" href={{ pathname: "/leads", query: { ...sp, page: page + 1 } }}>Next</Link>}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
