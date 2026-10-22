"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pill, tierTone } from "@/components/ui/pill";
import { Textarea, Input, Label, Select } from "@/components/ui/field";
import { approveReview, rejectReview, saveMessage } from "@/server/actions/review";
import { cn } from "@/lib/utils";

export type ReviewItem = {
  reviewId: string; personId: string; name: string; title: string | null; company: string | null; email: string | null; linkedinUrl: string | null;
  tier: string | null; score: number | null; summary: string | null; hooks: { hook: string; evidence_id: string }[]; flags: string[];
  messages: { id: string; channel: string; step: number; subject: string | null; body: string; qaFlags: string[]; factsUsed: { fact: string; evidence_id: string }[] }[];
};

export function ReviewQueue({ items }: { items: ReviewItem[] }) {
  const [idx, setIdx] = useState(0);
  const [pending, start] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("weak_fit");
  const router = useRouter();
  const item = items[Math.min(idx, items.length - 1)];

  function approve() {
    start(async () => {
      try { await approveReview(item.reviewId); toast.success(`Approved ${item.name}`); router.refresh(); }
      catch (e) { toast.error(e instanceof Error ? e.message : "Could not approve"); }
    });
  }
  function reject() {
    start(async () => { await rejectReview(item.reviewId, reason); setRejecting(false); toast("Rejected"); router.refresh(); });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "TEXTAREA" || t.tagName === "INPUT" || t.tagName === "SELECT")) return;
      if (e.key === "j") setIdx((i) => Math.min(i + 1, items.length - 1));
      if (e.key === "k") setIdx((i) => Math.max(i - 1, 0));
      if (e.key === "a") approve();
      if (e.key === "x") setRejecting(true);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.reviewId, items.length]);

  if (!item) return null;

  return (
    <div className="grid lg:grid-cols-[300px_1fr] gap-6 fade-up">
      <div className="card overflow-hidden self-start">
        <div className="px-4 pt-4 pb-2 t-caption">{items.length} waiting</div>
        <ul>
          {items.map((it, i) => (
            <li key={it.reviewId}>
              <button onClick={() => setIdx(i)} className={cn("w-full text-left px-4 py-3 border-t border-line hover:bg-surface-2 transition", i === idx && "bg-accent-soft")}>
                <div className="flex items-center justify-between gap-2"><span className="text-[14px] font-medium truncate">{it.name}</span>{it.tier && <Pill tone={tierTone(it.tier)}>{it.tier}</Pill>}</div>
                <div className="t-caption truncate">{it.company} · {it.messages.length} drafts{it.messages.some((m) => m.qaFlags.length) ? " · flags" : ""}</div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-5">
        <div className="card p-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h2 className="h-title">{item.name}</h2>
              <div className="t-caption">{[item.title, item.company].filter(Boolean).join(" · ")}</div>
            </div>
            <div className="flex items-center gap-2">{item.tier && <Pill tone={tierTone(item.tier)}>Tier {item.tier} · {item.score}</Pill>}</div>
          </div>
          {item.summary && <p className="t-body mb-3">{item.summary}</p>}
          <div className="flex flex-wrap gap-1.5">
            {item.hooks.map((h, i) => <Pill key={i} tone="accent">{h.hook} <span className="t-mono opacity-70">{h.evidence_id}</span></Pill>)}
            {item.flags.map((f) => <Pill key={f} tone="warning">{f}</Pill>)}
          </div>
        </div>

        {item.messages.map((m) => <MessageEditor key={m.id} m={m} email={item.email} />)}

        <div className="glass sticky bottom-4 card p-4 flex items-center justify-between gap-3">
          <div className="t-caption">
            {item.linkedinUrl && <a className="text-accent mr-4" href={item.linkedinUrl} target="_blank" rel="noreferrer">Open LinkedIn profile</a>}
            Approve copies nothing anywhere: you send from your own mailbox or export to Instantly.
          </div>
          <div className="flex items-center gap-2">
            {rejecting ? (
              <>
                <Select value={reason} onChange={(e) => setReason(e.target.value)} className="!py-2 !w-auto">
                  <option value="weak_fit">Weak fit</option><option value="wrong_person">Wrong person</option><option value="not_icp">Not ICP</option>
                  <option value="bad_research">Bad research</option><option value="tone">Tone</option><option value="compliance">Compliance</option><option value="timing">Bad timing</option>
                </Select>
                <Button variant="danger" size="sm" loading={pending} onClick={reject}>Confirm reject</Button>
                <Button variant="secondary" size="sm" onClick={() => setRejecting(false)}>Cancel</Button>
              </>
            ) : (
              <>
                <Button variant="secondary" onClick={() => setRejecting(true)}><X className="h-4 w-4" /> Reject</Button>
                <Button loading={pending} onClick={approve}><Check className="h-4 w-4" /> Approve</Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageEditor({ m, email }: { m: ReviewItem["messages"][number]; email: string | null }) {
  const [subject, setSubject] = useState(m.subject ?? "");
  const [body, setBody] = useState(m.body);
  const [dirty, setDirty] = useState(false);
  const [pending, start] = useTransition();
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  const isEmail = m.channel === "email";

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2"><Pill tone={isEmail ? "accent" : "neutral"}>{m.channel} · step {m.step}</Pill>{m.qaFlags.map((f) => <Pill key={f} tone="warning">{f}</Pill>)}</div>
        <div className="flex items-center gap-2">
          <span className={cn("t-caption", isEmail ? words > 120 && "text-danger" : body.length > 300 && "text-danger")}>{isEmail ? `${words} words` : `${body.length}/300`}</span>
          <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(isEmail ? `Subject: ${subject}\n\n${body}` : body); toast.success("Copied"); }}><Copy className="h-3.5 w-3.5" /> Copy</Button>
          {isEmail && email && <a className="btn btn-ghost btn-sm" href={`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}>Open in mail</a>}
        </div>
      </div>
      {isEmail && <div className="mb-3"><Label htmlFor={`s-${m.id}`}>Subject</Label><Input id={`s-${m.id}`} value={subject} onChange={(e) => { setSubject(e.target.value); setDirty(true); }} /></div>}
      <Textarea value={body} onChange={(e) => { setBody(e.target.value); setDirty(true); }} className="min-h-[180px]" />
      {m.factsUsed.length > 0 && <div className="t-caption mt-2">Facts used: {m.factsUsed.map((f) => `${f.fact} [${f.evidence_id}]`).join(" · ")}</div>}
      {dirty && <div className="mt-3 flex justify-end"><Button size="sm" variant="secondary" loading={pending} onClick={() => start(async () => { await saveMessage(m.id, isEmail ? subject : null, body); setDirty(false); toast.success("Saved"); })}>Save edits</Button></div>}
    </div>
  );
}
