import { PageHeader } from "@/components/app/page-header";
import { Pill } from "@/components/ui/pill";
import { runDiagnostics } from "@/lib/diagnostics";

export const dynamic = "force-dynamic";

export default async function DiagnosticsPage() {
  const d = await runDiagnostics();
  const total = d.timings.reduce((a, b) => a + b.ms, 0);
  const slow = (ms: number) => ms > 800 ? "danger" : ms > 300 ? "warning" : "success";
  return (
    <>
      <PageHeader title="Diagnostics" description="Reload this page three times, then send a screenshot. The first load is often a cold start; the second and third show the steady state." />
      <div className="grid md:grid-cols-4 gap-4 mb-6 fade-up">
        <div className="card p-5"><div className="t-caption">Server region</div><div className="text-[22px] font-semibold mt-1">{d.region}</div><div className="t-caption mt-1">hnd1 = Tokyo, next to the database</div></div>
        <div className="card p-5"><div className="t-caption">This request</div><div className="text-[22px] font-semibold mt-1">{d.coldStart ? "cold start" : "warm"}</div><div className="t-caption mt-1">request {d.requestsOnInstance} on a server {d.instanceAgeSec}s old</div></div>
        <div className="card p-5"><div className="t-caption">Database host</div><div className="text-[13px] font-medium mt-2 break-all t-mono">{d.dbHost || "—"}</div></div>
        <div className="card p-5"><div className="t-caption">Checks total</div><div className="text-[22px] font-semibold mt-1">{total} ms</div><div className="t-caption mt-1">measured on the server</div></div>
      </div>
      <div className="card overflow-hidden fade-up">
        <div className="table-wrap"><table className="table"><thead><tr><th>Step</th><th>Time</th><th>Result</th></tr></thead>
          <tbody>{d.timings.map((t) => <tr key={t.label}><td className="font-medium">{t.label}</td><td><Pill tone={slow(t.ms)}>{t.ms} ms</Pill></td><td className="t-caption">{t.note ?? ""}</td></tr>)}</tbody></table></div>
      </div>
      <p className="t-caption mt-4">Rule of thumb: a database round trip under 50 ms means the server sits next to the database. Over 150 ms means they are in different regions. A cold start adds one to three seconds on top of everything, once, after the site has been idle.</p>
    </>
  );
}
