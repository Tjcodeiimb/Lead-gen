"use client";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Health = { ok: boolean; supabaseProject: string; checks: Record<string, string>; db: string; migrations: string };

/** Friendly fallback when a page fails. It asks /api/health what is wrong and shows the answer. */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [health, setHealth] = useState<Health | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    console.error(error);
    fetch("/api/health", { cache: "no-store" }).then((r) => r.json()).then(setHealth).catch(() => setFailed(true));
  }, [error]);

  const problems = health ? Object.entries({ ...health.checks, database: health.db, migrations: health.migrations }).filter(([, v]) => /MISSING|EMPTY|FAILED/.test(v)) : [];

  return (
    <div className="card p-8 max-w-2xl mx-auto mt-12 fade-up">
      <h2 className="h-title mb-2">Something went wrong</h2>
      {!health && !failed && <p className="t-body text-ink-2">Checking what the cause is…</p>}
      {failed && <p className="t-body text-ink-2">Couldn&apos;t reach the server to diagnose. It may be restarting; try again in a minute.</p>}
      {health && (
        <>
          {problems.length === 0 ? (
            <p className="t-body text-ink-2">Everything looks connected now. This was probably a one-off, such as a dropped connection. Try again.</p>
          ) : (
            <>
              <p className="t-body text-ink-2 mb-4">Here is what the app found:</p>
              <ul className="space-y-2 mb-4">
                {problems.map(([k, v]) => (
                  <li key={k} className="rounded-xl bg-surface-2 border border-line px-4 py-3 text-[14px]"><span className="font-medium">{k.replace(/_/g, " ")}:</span> <span className="text-danger">{v}</span></li>
                ))}
              </ul>
              <p className="t-caption">Settings live in Vercel → your project → Settings → Environment Variables. After changing one, click Redeploy.</p>
            </>
          )}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 mt-5 t-caption">
            <dt>Supabase project</dt><dd className="t-mono">{health.supabaseProject || "—"}</dd>
            <dt>Database</dt><dd>{health.db}</dd>
            <dt>Migrations</dt><dd>{health.migrations}</dd>
            {error.digest && <><dt>Error ID</dt><dd className="t-mono">{error.digest}</dd></>}
          </dl>
        </>
      )}
      <div className="mt-6"><Button onClick={reset}><RefreshCw className="h-4 w-4" /> Try again</Button></div>
    </div>
  );
}
