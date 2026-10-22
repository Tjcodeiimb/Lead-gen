import { LoginForm } from "./login-form";
import { isConfigured } from "@/lib/env";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const denied = sp.denied === "1";
  const error = sp.error === "1";
  const configured = isConfigured();

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-[420px] fade-up">
        <div className="flex items-center gap-3 mb-10">
          <div className="h-10 w-10 rounded-[12px] bg-ink text-canvas flex items-center justify-center text-[15px] font-semibold">U</div>
          <div>
            <div className="text-[17px] font-semibold tracking-[-0.02em]">UpForge OS</div>
            <div className="t-caption">Internal lead-generation workspace</div>
          </div>
        </div>

        <h1 className="h-display mb-2">Sign in.</h1>
        <p className="t-body text-ink-2 mb-8">We&apos;ll email you a one-time link. No password to remember.</p>

        {!configured ? (
          <div className="card p-6">
            <h2 className="h-section mb-2">Almost there: connect Supabase</h2>
            <p className="t-caption mb-4">
              The app needs three values in <code className="t-mono">.env.local</code> before anyone can sign in.
              Follow <code className="t-mono">SETUP.md</code> step 2.
            </p>
            <ul className="t-caption space-y-1 list-disc pl-4">
              <li>NEXT_PUBLIC_SUPABASE_URL</li>
              <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
              <li>DATABASE_URL</li>
            </ul>
          </div>
        ) : (
          <div className="card p-6">
            {denied && <p className="pill pill-danger mb-4">That email isn&apos;t on the allowlist (ALLOWED_EMAILS).</p>}
            {error && <p className="pill pill-danger mb-4">That link has expired. Request a new one.</p>}
            <LoginForm />
          </div>
        )}
      </div>
    </main>
  );
}
