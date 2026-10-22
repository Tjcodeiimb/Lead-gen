"use client";
import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    const supabase = createSupabaseBrowser();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) setError(error.message); else setSent(true);
  }

  if (sent) {
    return (
      <div>
        <h2 className="h-section mb-1">Check your inbox</h2>
        <p className="t-caption">We sent a sign-in link to <span className="text-ink">{email}</span>. It expires in an hour.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label htmlFor="email">Work email</Label>
        <Input id="email" type="email" required autoFocus placeholder="you@upforgeconsulting.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      {error && <p className="t-caption text-danger">{error}</p>}
      <Button type="submit" loading={loading} className="w-full">Send sign-in link</Button>
    </form>
  );
}
