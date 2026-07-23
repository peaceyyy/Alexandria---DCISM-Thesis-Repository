/**
 * MinimalHeader — used only on the landing page (/).
 *
 * Shows: brand mark + wordmark (left), GitHub repo link (right).
 * No auth chrome, no role indicator, no CTA. The landing page's
 * sole job is to introduce Alexandria and point to /home.
 */
import { GitFork } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AlexandriaBrandLockup } from "@/components/ui/alexandria-brand-lockup";

export function MinimalHeader() {
  return (
    <header className="relative z-10 flex h-16 items-center justify-between px-6 sm:px-10">
      {/* Brand */}
      <a
        href="/home"
        className="text-[var(--color-text)] no-underline"
        aria-label="Alexandria — go to repository"
      >
        <AlexandriaBrandLockup
          wordmarkClassName="text-[20px] font-black"
          priority
        />
      </a>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <a
          href="https://github.com/peaceyyy/Alexandria---DCISM-Thesis-Repository"
          target="_blank"
          rel="noreferrer"
          aria-label="View Alexandria source on GitHub"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-separator-mid)] text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-separator-mid)] hover:text-[var(--color-text)]"
        >
          <GitFork size={18} aria-hidden />
        </a>
      </div>
    </header>
  );
}
