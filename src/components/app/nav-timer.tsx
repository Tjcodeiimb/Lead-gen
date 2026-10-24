"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Shows how long the last page took to arrive, measured in the browser.
 * Click → stored in sessionStorage by every in-app link (see RowLink/Sidebar) → read here on arrival.
 */
export function NavTimer({ serverStartedAt, coldStart }: { serverStartedAt: number; coldStart: boolean }) {
  const pathname = usePathname();
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    // Measured after paint, in a timeout, so the state update is not synchronous inside the effect.
    const id = setTimeout(() => {
    let ms: number | null = null;
    try {
      const clicked = Number(sessionStorage.getItem("nav:clickedAt") ?? 0);
      if (clicked && Date.now() - clicked < 60_000) ms = Date.now() - clicked;
      sessionStorage.removeItem("nav:clickedAt");
    } catch {}
    if (ms === null) {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      if (nav) ms = Math.round(nav.responseEnd - nav.startTime);
    }
    if (ms !== null) setLabel(`${(ms / 1000).toFixed(1)}s${coldStart ? " · cold start" : ""}`);
    }, 0);
    return () => clearTimeout(id);
    // serverStartedAt is here so the effect re-runs on every server render, not only pathname changes.
  }, [pathname, serverStartedAt, coldStart]);
  if (!label) return null;
  return <span className="t-caption" title="Time from your click to this page arriving. 'cold start' means Vercel had to start the server first.">{label}</span>;
}

export function markNavClick() {
  try { sessionStorage.setItem("nav:clickedAt", String(Date.now())); } catch {}
}
