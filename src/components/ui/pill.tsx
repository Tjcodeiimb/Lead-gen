import { cn } from "@/lib/utils";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger";

export function Pill({ tone = "neutral", className, children }: { tone?: Tone; className?: string; children: React.ReactNode }) {
  return <span className={cn("pill", tone !== "neutral" && `pill-${tone}`, className)}>{children}</span>;
}

export function tierTone(tier?: string | null): Tone {
  switch (tier) {
    case "A": return "success";
    case "B": return "accent";
    case "C": return "neutral";
    case "DQ": return "danger";
    case "NEEDS_RESEARCH": return "warning";
    default: return "neutral";
  }
}

export function statusTone(status?: string | null): Tone {
  if (!status) return "neutral";
  if (["approved", "sent", "replied", "meeting_booked", "won", "qualified", "active"].includes(status)) return "success";
  if (["in_review", "copy_ready", "needs_research", "paused", "nurture"].includes(status)) return "warning";
  if (["disqualified", "lost", "unsubscribed", "bounced", "do_not_contact", "rejected"].includes(status)) return "danger";
  if (["qualifying", "researching", "draft", "new"].includes(status)) return "neutral";
  return "accent";
}
