"use client";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Sidebar } from "./sidebar";

/** App frame: fixed sidebar on wide screens, slide-in drawer on phones. */
export function Shell({ email, pendingReviews, serverStartedAt, coldStart, children }: { email: string; pendingReviews: number; serverStartedAt: number; coldStart: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen">
      {/* Phone top bar */}
      <header className="glass lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 border-b border-line">
        <button type="button" onClick={() => setOpen(true)} className="nav-item !px-2 !py-1.5" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
        <div className="text-[15px] font-semibold tracking-[-0.02em]">UpForge OS</div>
        <div className="w-9" />
      </header>

      {/* Drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[280px] bg-surface shadow-float" onClick={() => setOpen(false)}>
            <button type="button" onClick={() => setOpen(false)} className="absolute right-3 top-4 nav-item !px-2 !py-1.5" aria-label="Close menu"><X className="h-5 w-5" /></button>
            <Sidebar email={email} pendingReviews={pendingReviews} inline serverStartedAt={serverStartedAt} coldStart={coldStart} />
          </div>
        </div>
      )}

      <div className="hidden lg:block"><Sidebar email={email} pendingReviews={pendingReviews} serverStartedAt={serverStartedAt} coldStart={coldStart} /></div>
      <main className="lg:pl-[248px]">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-10 py-6 lg:py-10">{children}</div>
      </main>
    </div>
  );
}
