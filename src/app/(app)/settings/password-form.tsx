"use client";
import { useState } from "react";
import { toast } from "sonner";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";

export function PasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 12) return void toast.error("Use at least 12 characters.");
    if (password !== confirm) return void toast.error("The two passwords don't match.");
    setLoading(true);
    const { error } = await createSupabaseBrowser().auth.updateUser({ password });
    setLoading(false);
    if (error) return void toast.error(error.message);
    setPassword(""); setConfirm("");
    toast.success("Password changed");
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div><Label htmlFor="np" hint="At least 12 characters. A few random words works well.">New password</Label><Input id="np" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      <div><Label htmlFor="cp">Repeat new password</Label><Input id="cp" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
      <Button type="submit" variant="secondary" loading={loading}>Change password</Button>
    </form>
  );
}
