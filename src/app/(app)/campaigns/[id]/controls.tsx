"use client";
import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateBrief, setCampaignStatus } from "@/server/actions/campaigns";

export function GenerateBriefButton({ id, autoStart, variant = "primary", label = "Generate plan with Claude" }: { id: string; autoStart?: boolean; variant?: "primary" | "secondary"; label?: string }) {
  const [pending, start] = useTransition();
  const startedRef = useRef(false);
  const router = useRouter();

  function run() {
    start(async () => {
      const res = await generateBrief(id);
      if (res.ok) { toast.success("Plan generated"); router.replace(`/campaigns/${id}`); router.refresh(); }
      else toast.error(res.error);
    });
  }
  useEffect(() => {
    if (autoStart && !startedRef.current) { startedRef.current = true; run(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  return <Button onClick={run} loading={pending} variant={variant} className={variant === "secondary" ? "w-full" : ""}><Sparkles className="h-4 w-4" /> {pending ? "Thinking…" : label}</Button>;
}

export function StatusButtons({ id, status }: { id: string; status: string }) {
  const [pending, start] = useTransition();
  const next = status === "active" ? "paused" : "active";
  return (
    <Button size="sm" variant="secondary" loading={pending} onClick={() => start(async () => { await setCampaignStatus(id, next); toast.success(`Campaign ${next}`); })}>
      {status === "active" ? "Pause" : "Activate"}
    </Button>
  );
}
