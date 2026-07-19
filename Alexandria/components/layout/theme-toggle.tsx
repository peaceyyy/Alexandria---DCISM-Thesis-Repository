"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "dark" | "light";

type ThemeToggleProps = {
  presentation?: "icon" | "tile" | "strip";
  className?: string;
};

export function ThemeToggle({
  presentation = "icon",
  className,
}: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = window.localStorage.getItem("alexandria-theme");
    if (stored === "light") {
      setTheme("light");
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.dataset.theme = theme;
    }
  }, [theme, mounted]);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("alexandria-theme", next);
  }

  // Prevent hydration mismatch by returning a placeholder or null until mounted
  if (!mounted) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      className={
        presentation === "tile"
          ? `inline-flex min-h-[52px] w-full flex-col items-center justify-center gap-1 rounded-[10px] border border-[var(--color-separator-mid)] bg-[var(--color-text)]/5 px-1 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-text)]/10 hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-bright)]/30 ${className ?? ""}`
          : presentation === "strip"
          ? `inline-flex h-9 w-full items-center justify-center rounded-lg border border-[var(--color-separator-mid)] bg-transparent text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-text)]/5 hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-bright)]/30 ${className ?? ""}`
          : `inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-separator-mid)] bg-[var(--color-text)]/5 text-[var(--color-text)] transition-colors hover:bg-[var(--color-text)]/10 ${className ?? ""}`
      }
    >
      {theme === "dark" ? (
        <Sun aria-hidden size={16} className="text-amber-400" />
      ) : (
        <Moon aria-hidden size={16} className="text-slate-500" />
      )}
      {presentation === "tile" ? (
        <span className="theme-toggle-tile-label text-[10px] font-semibold leading-none">
          Theme
        </span>
      ) : null}
    </button>
  );
}
