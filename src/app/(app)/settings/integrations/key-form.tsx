"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { saveIntegrationKey } from "@/server/actions/settings";

export function KeyForm({ settingKey }: { settingKey: string }) {
  const [value, setValue] = useState("");
  const [pending, start] = useTransition();
  return (
    <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await saveIntegrationKey(settingKey, value); if (r.ok) { toast.success("Saved"); setValue(""); } else toast.error(r.error); }); }}>
      <Input type="password" placeholder="Paste key" value={value} onChange={(e) => setValue(e.target.value)} className="!py-2" autoComplete="off" />
      <Button type="submit" size="sm" variant="secondary" loading={pending} disabled={!value.trim()}>Save</Button>
    </form>
  );
}
