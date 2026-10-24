"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { setProviderOrder } from "@/server/actions/settings";

export function OrderForm({ settingKey, value, allowed }: { settingKey: string; value: string; allowed: string[] }) {
  const [v, setV] = useState(value);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await setProviderOrder(settingKey, v, allowed); if (r.ok) { toast.success("Order saved"); router.refresh(); } else toast.error(r.error); }); }}>
      <Input value={v} onChange={(e) => setV(e.target.value)} className="!py-2 !text-[13px] t-mono" />
      <Button type="submit" size="sm" variant="secondary" loading={pending}>Save</Button>
    </form>
  );
}
