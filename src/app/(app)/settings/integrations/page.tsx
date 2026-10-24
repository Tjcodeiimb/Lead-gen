import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { INTEGRATIONS, getAllKeyStatus, getJsonSetting, providerOf, usageSummary } from "@/lib/integrations/keys";
import { isMock } from "@/lib/claude/client";
import { FINDER_ORDER_DEFAULT, VERIFIER_ORDER_DEFAULT } from "@/lib/finders/email";
import { Pill } from "@/components/ui/pill";
import { KeyCard } from "./key-card";
import { Notice } from "./notice";
import { OrderForm } from "./order-form";

const GROUPS: { id: (typeof INTEGRATIONS)[number]["group"]; title: string; blurb: string }[] = [
  { id: "claude", title: "Claude", blurb: "The only key you really need. Everything else is optional." },
  { id: "email_finder", title: "Email finders (auto-switch)", blurb: "Tried in order. When one runs out for the month, the next one is used automatically." },
  { id: "email_verifier", title: "Email verifiers", blurb: "Checks an address before you send, so bounces stay low." },
  { id: "lead_source", title: "Lead sources", blurb: "Used by the Find leads tab on a campaign." },
];

export default async function IntegrationsPage({ searchParams }: PageProps<"/settings/integrations">) {
  const sp = await searchParams;
  const [status, usage, google, mock, finderOrder, verifierOrder] = await Promise.all([
    getAllKeyStatus(), usageSummary(), getJsonSetting<{ email?: string }>("google_oauth"), isMock(),
    getJsonSetting<string[]>("email_finder_order"), getJsonSetting<string[]>("email_verifier_order"),
  ]);
  const gmailReady = status.google_client_id.set && status.google_client_secret.set;

  return (
    <>
      <PageHeader title="Integrations" description="Every service here has a free plan. Paste a key, follow the steps under each card if you need help, and the meters show what's left this month." />
      <Notice connected={typeof sp.connected === "string" ? sp.connected : undefined} error={typeof sp.error === "string" ? sp.error : undefined} />

      <div className="space-y-10 fade-up">
        {GROUPS.map((g) => (
          <section key={g.id}>
            <div className="mb-3"><h2 className="h-title">{g.title}</h2><p className="t-caption">{g.blurb}</p></div>
            {g.id === "claude" && <div className="mb-3"><Pill tone={mock ? "warning" : "success"}>{mock ? "mock mode: samples only, nothing spent" : "live"}</Pill></div>}
            <div className="grid md:grid-cols-2 gap-4">
              {INTEGRATIONS.filter((i) => i.group === g.id).map((i) => (
                <KeyCard key={i.key} def={{ key: i.key, label: i.label, help: i.help, link: i.link, steps: [...i.steps], unit: "unit" in i ? i.unit : undefined }}
                  status={status[i.key]} usage={usage[providerOf(i.key)]} testable={i.key === "claude_api_key"} />
              ))}
            </div>
            {g.id === "email_finder" && (
              <div className="card p-5 mt-4">
                <h3 className="h-section mb-1">Order of use</h3>
                <p className="t-caption mb-3">Comma-separated. Providers without a key are skipped. Default: {FINDER_ORDER_DEFAULT.join(", ")}.</p>
                <OrderForm settingKey="email_finder_order" value={(finderOrder ?? [...FINDER_ORDER_DEFAULT]).join(", ")} allowed={[...FINDER_ORDER_DEFAULT]} />
                <p className="t-caption mt-4 mb-2">Verifier order. Default: {VERIFIER_ORDER_DEFAULT.join(", ")}.</p>
                <OrderForm settingKey="email_verifier_order" value={(verifierOrder ?? [...VERIFIER_ORDER_DEFAULT]).join(", ")} allowed={[...VERIFIER_ORDER_DEFAULT]} />
              </div>
            )}
          </section>
        ))}

        <section>
          <div className="mb-3"><h2 className="h-title">Gmail drafts</h2><p className="t-caption">Approved emails become drafts in your Gmail. The app can create drafts only; it cannot read your mail or send.</p></div>
          <div className="card p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <span className="text-[14px] font-medium">Connection</span>
              <Pill tone={google?.email ? "success" : gmailReady ? "warning" : "neutral"}>{google?.email ? `connected · ${google.email}` : gmailReady ? "ready to connect" : "needs client ID and secret"}</Pill>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              {INTEGRATIONS.filter((i) => i.group === "sending").map((i) => (
                <KeyCard key={i.key} def={{ key: i.key, label: i.label, help: i.help, link: i.link, steps: [...i.steps] }} status={status[i.key]} compact />
              ))}
            </div>
            {gmailReady && <Link href="/api/google/connect" className="btn btn-primary">{google?.email ? "Reconnect Google" : "Connect Google"}</Link>}
          </div>
        </section>
      </div>
    </>
  );
}
