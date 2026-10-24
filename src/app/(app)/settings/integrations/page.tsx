import { PageHeader } from "@/components/app/page-header";
import { INTEGRATIONS, getAllKeyStatus, getJsonSetting } from "@/lib/integrations/keys";
import { KeyForm } from "./key-form";
import { Pill } from "@/components/ui/pill";
import Link from "next/link";
import { Notice } from "./notice";

export default async function IntegrationsPage({ searchParams }: PageProps<"/settings/integrations">) {
  const sp = await searchParams;
  const status = await getAllKeyStatus();
  const google = await getJsonSetting<{ email?: string }>("google_oauth");
  const gmailReady = status.google_client_id.set && status.google_client_secret.set;
  return (
    <>
      <PageHeader title="Integrations" description="Each finder needs a free account and its API key. Paste keys here; they are stored in your database, not in the code." />
      <Notice connected={typeof sp.connected === "string" ? sp.connected : undefined} error={typeof sp.error === "string" ? sp.error : undefined} />
      <div className="grid lg:grid-cols-2 gap-6 fade-up">
        <div className="space-y-6">
          {INTEGRATIONS.filter((i) => !i.key.startsWith("google")).map((i) => (
            <section key={i.key} className="card p-6">
              <div className="flex items-start justify-between gap-3 mb-1">
                <h3 className="h-section">{i.label}</h3>
                <Pill tone={status[i.key].set ? "success" : "neutral"}>{status[i.key].set ? (status[i.key].fromEnv ? "set via env" : `set · …${status[i.key].last4}`) : "not set"}</Pill>
              </div>
              <p className="t-caption mb-3">{i.help} <a className="text-accent" href={i.link} target="_blank" rel="noreferrer">Get key</a></p>
              {!status[i.key].fromEnv && <KeyForm settingKey={i.key} />}
            </section>
          ))}
        </div>
        <div className="space-y-6">
          <section className="card p-6">
            <div className="flex items-start justify-between gap-3 mb-1">
              <h3 className="h-section">Gmail drafts</h3>
              <Pill tone={google?.email ? "success" : gmailReady ? "warning" : "neutral"}>{google?.email ? `connected · ${google.email}` : gmailReady ? "ready to connect" : "needs client ID"}</Pill>
            </div>
            <p className="t-caption mb-4">Approved emails become drafts in your Gmail. One-time setup in Google Cloud, then one click to connect. Steps are in <code className="t-mono">SETUP.md</code>, section 6.</p>
            {INTEGRATIONS.filter((i) => i.key.startsWith("google")).map((i) => (
              <div key={i.key} className="mb-4">
                <div className="flex items-center justify-between mb-1"><span className="text-[13px] font-medium">{i.label}</span><Pill tone={status[i.key].set ? "success" : "neutral"}>{status[i.key].set ? "set" : "not set"}</Pill></div>
                {!status[i.key].fromEnv && <KeyForm settingKey={i.key} />}
              </div>
            ))}
            {gmailReady && (
              <Link href="/api/google/connect" className="btn btn-primary">{google?.email ? "Reconnect Google" : "Connect Google"}</Link>
            )}
          </section>
          <section className="card p-6">
            <h3 className="h-section mb-2">What each finder costs</h3>
            <ul className="t-caption space-y-1.5 list-disc pl-4">
              <li><strong className="text-ink">Claude web research:</strong> about $0.10 to $0.30 per run from your API credits. No account needed.</li>
              <li><strong className="text-ink">Apollo:</strong> searching is free and unlimited. Revealing a person&apos;s email costs 1 credit; the free plan gives 75 a month.</li>
              <li><strong className="text-ink">Signals:</strong> news is free with no key. Job posts use TheirStack credits (200 free a month). UK registry is free with a key.</li>
              <li><strong className="text-ink">Hunter:</strong> 25 email finds and 50 verifications a month on the free plan.</li>
            </ul>
          </section>
        </div>
      </div>
    </>
  );
}
