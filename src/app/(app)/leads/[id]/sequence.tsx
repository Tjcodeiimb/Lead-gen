"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Copy, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill, statusTone } from "@/components/ui/pill";
import { draftInGmail, markReplied, markSent } from "@/server/actions/review";
import { findLeadEmail } from "@/server/actions/finders";

type Msg = { id: string; channel: string; step: number; dayOffset: number; subject: string | null; body: string; status: string; qaFlags: string[]; sentAt: Date | null; gmailDraftId: string | null };

export function Sequence({ personId, email, status, nextStep, nextStepDue, messages, gmailConnected, hunterReady }: {
  personId: string; email: string | null; status: string; nextStep: number | null; nextStepDue: string | null; messages: Msg[]; gmailConnected: boolean; hunterReady: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState<string | null>(messages.find((m) => m.step === (nextStep ?? 1) && m.channel === "email")?.id ?? null);
  const emails = messages.filter((m) => m.channel === "email").sort((a, b) => a.step - b.step);
  const linkedin = messages.find((m) => m.channel === "linkedin");
  const approved = emails.some((m) => m.status === "approved");
  const today = new Date().toISOString().slice(0, 10);
  const overdue = nextStepDue && nextStepDue <= today;

  const mailto = (m: Msg) => `mailto:${email ?? ""}?subject=${encodeURIComponent(m.subject ?? "")}&body=${encodeURIComponent(m.body)}`;

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="h-section">Sequence</h3>
          <p className="t-caption">{nextStep ? <>Next: step {nextStep}{nextStepDue ? <>, due <span className={overdue ? "text-danger font-medium" : "text-ink"}>{nextStepDue}</span></> : null}</> : status === "nurture" ? "Sequence finished. Lead is in nurture." : "Not started."}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!email && hunterReady && <Button size="sm" variant="secondary" loading={pending} onClick={() => start(async () => { const r = await findLeadEmail(personId); if (r.ok) { toast.success(r.email ? `Found ${r.email}` : "No email found"); router.refresh(); } else toast.error(r.error); })}><Mail className="h-3.5 w-3.5" /> Find email</Button>}
          {approved && gmailConnected && email && <Button size="sm" variant="secondary" loading={pending} onClick={() => start(async () => { const r = await draftInGmail(personId); if (r.ok) { toast.success(r.created ? `${r.created} draft${r.created === 1 ? "" : "s"} created in Gmail` : "Drafts already exist in Gmail"); router.refresh(); } else toast.error(r.error); })}>Draft all in Gmail</Button>}
          {(status === "sent" || status === "approved") && (
            <>
              <Button size="sm" variant="ghost" loading={pending} onClick={() => start(async () => { await markReplied(personId, "replied"); toast.success("Marked replied"); router.refresh(); })}><MessageSquare className="h-3.5 w-3.5" /> They replied</Button>
              <Button size="sm" variant="ghost" loading={pending} onClick={() => start(async () => { await markReplied(personId, "meeting_booked"); toast.success("Meeting booked"); router.refresh(); })}>Meeting booked</Button>
            </>
          )}
        </div>
      </div>

      {emails.length === 0 ? <p className="t-caption">No drafts yet. Run the pipeline to write the sequence.</p> : (
        <ol className="space-y-2">
          {emails.map((m) => {
            const isNext = nextStep === m.step && m.status === "approved" && !m.sentAt;
            const isOpen = open === m.id;
            return (
              <li key={m.id} className={`rounded-xl border ${isNext ? "border-accent" : "border-line"} bg-surface-2`}>
                <button type="button" className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left" onClick={() => setOpen(isOpen ? null : m.id)}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="t-mono w-14 shrink-0">Day {m.dayOffset}</span>
                    <span className="text-[14px] font-medium truncate">{m.subject}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {m.sentAt ? <Pill tone="success"><Check className="h-3 w-3" /> sent</Pill> : <Pill tone={statusTone(m.status)}>{m.status.replace("_", " ")}</Pill>}
                    {m.gmailDraftId && <Pill tone="accent">in Gmail</Pill>}
                    {m.qaFlags.map((f) => <Pill key={f} tone="warning">{f}</Pill>)}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4">
                    <pre className="whitespace-pre-wrap font-sans text-[14px] leading-relaxed mb-3">{m.body}</pre>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(`Subject: ${m.subject}\n\n${m.body}`); toast.success("Copied"); }}><Copy className="h-3.5 w-3.5" /> Copy</Button>
                      {email && m.status === "approved" && <a className="btn btn-ghost btn-sm" href={mailto(m)}>Open in mail app</a>}
                      {isNext && <Button size="sm" loading={pending} onClick={() => start(async () => { await markSent(personId, m.step); toast.success(`Step ${m.step} marked sent`); router.refresh(); })}><Check className="h-3.5 w-3.5" /> I sent this</Button>}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
          {linkedin && (
            <li className="rounded-xl border border-line bg-surface-2 px-4 py-3">
              <div className="flex items-center justify-between gap-3 mb-1"><span className="text-[14px] font-medium">LinkedIn note <span className="t-caption">· day 1 · send by hand</span></span><Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(linkedin.body); toast.success("Copied"); }}><Copy className="h-3.5 w-3.5" /> Copy</Button></div>
              <p className="text-[14px]">{linkedin.body}</p>
            </li>
          )}
        </ol>
      )}
    </section>
  );
}
