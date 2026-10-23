"use client";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  function toggle() {
    const dark = document.documentElement.classList.toggle("dark");
    try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch {}
  }
  return (
    <button type="button" onClick={toggle} className="nav-item !px-2 !py-1.5" title="Toggle theme" aria-label="Toggle theme">
      <Sun className="h-4 w-4 hidden dark:block" strokeWidth={1.8} />
      <Moon className="h-4 w-4 dark:hidden" strokeWidth={1.8} />
    </button>
  );
}
