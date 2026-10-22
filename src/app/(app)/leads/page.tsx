import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Plus, Upload, Users } from "lucide-react";
import { db } from "@/db/client";
import { companies, people } from "@/db/schema";
import { PageHeader } from "@/components/app/page-header";
import { Empty } from "@/components/ui/empty";
import { Pill, statusTone, tierTone } from "@/components/ui/pill";
import { timeAgo } from "@/lib/utils";

export default async function LeadsPage() {
  const rows = await db.select({ p: people, company: companies.name }).from(people).leftJoin(companies, eq(companies.id, people.companyId)).orderBy(desc(people.createdAt)).limit(200);
  return (
    <>
      <PageHeader title="Leads" description="Every person you might contact, with their tier and where they are in the pipeline."
        action={<div className="flex gap-2"><Link href="/leads/new" className="btn btn-secondary"><Plus className="h-4 w-4" /> Add lead</Link><Link href="/leads/import" className="btn btn-primary"><Upload className="h-4 w-4" /> Import CSV</Link></div>} />
      <div className="card overflow-hidden fade-up">
        {rows.length === 0 ? (
          <Empty icon={Users} title="No leads yet" description="Import a CSV from Apollo, Sales Navigator (manual export) or a spreadsheet. Columns are matched automatically." action={<Link href="/leads/import" className="btn btn-primary">Import CSV</Link>} />
        ) : (
          <table className="table">
            <thead><tr><th>Name</th><th>Company</th><th>Title</th><th>Tier</th><th>Score</th><th>Status</th><th>Added</th></tr></thead>
            <tbody>
              {rows.map(({ p, company }) => (
                <tr key={p.id}>
                  <td className="font-medium"><Link href={`/leads/${p.id}`} className="hover:text-accent">{p.fullName}</Link></td>
                  <td>{company}</td><td className="t-caption">{p.title}</td>
                  <td>{p.tier && <Pill tone={tierTone(p.tier)}>{p.tier}</Pill>}</td>
                  <td>{p.score ?? ""}</td>
                  <td><Pill tone={statusTone(p.status)}>{p.status.replace(/_/g, " ")}</Pill></td>
                  <td className="t-caption">{timeAgo(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
