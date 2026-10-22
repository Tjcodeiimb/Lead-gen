"use client";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="nav-item !px-2 !py-1.5"
      title="Toggle theme"
      aria-label="Toggle theme"
    >
      {/* Both icons are rendered; CSS picks one, so there is no hydration mismatch. */}
      <Sun className="h-4 w-4 hidden dark:block" strokeWidth={1.8} />
      <Moon className="h-4 w-4 dark:hidden" strokeWidth={1.8} />
    </button>
  );
}
