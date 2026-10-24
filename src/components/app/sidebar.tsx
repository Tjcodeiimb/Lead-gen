"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Megaphone, Users, CheckSquare, Settings, LogOut, Plug } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutGrid, exact: true },
  { href: "/campaigns", label: "Campaigns", icon: Megaphone },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/review", label: "Review Queue", icon: CheckSquare },
  { href: "/settings/integrations", label: "Integrations", icon: Plug },
  { href: "/settings", label: "Settings", icon: Settings, exact: true },
];

export function Sidebar({ email, pendingReviews, inline }: { email: string; pendingReviews: number; inline?: boolean }) {
  const pathname = usePathname();
  return (
    <aside className={inline ? "h-full flex flex-col px-4 py-6" : "glass fixed inset-y-0 left-0 w-[248px] border-r border-line flex flex-col px-4 py-6 z-20"}>
      <Link href="/" className="flex items-center gap-2.5 px-2 mb-8">
        <div className="h-8 w-8 rounded-[10px] bg-ink text-canvas flex items-center justify-center text-[13px] font-semibold">U</div>
        <div className="leading-tight">
          <div className="text-[15px] font-semibold tracking-[-0.02em]">UpForge OS</div>
          <div className="t-caption">Lead generation</div>
        </div>
      </Link>

      <nav className="flex flex-col gap-1">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className="nav-item" data-active={active}>
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
              <span className="flex-1">{label}</span>
              {label === "Review Queue" && pendingReviews > 0 && (
                <span className="pill pill-accent">{pendingReviews}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-2">
        <div className="flex items-center justify-between mb-3">
          <ThemeToggle />
          <form action="/auth/signout" method="post">
            <button className="nav-item !px-2 !py-1.5" title="Sign out" type="submit">
              <LogOut className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </form>
        </div>
        <div className="t-caption truncate">{email}</div>
      </div>
    </aside>
  );
}
