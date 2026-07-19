/**
 * AppHeader — the shared header for all content pages (/home, etc.)
 *
 * Layout (left → right):
 *   [Logo mark + wordmark]  [────── Search bar ──────]  [Role/Dashboard group | Contribute]
 *
 * Right cluster behaviour by role:
 *   • Guest   → role pill (→ /login)  |  separator  |  "Sign In" (intercept modal)
 *   • Member  → role pill (→ /profile) |  separator  |  "Contribute" (→ /upload)
 *   • Mod     → role pill + "Dashboard →" | "Contribute"
 *   • Admin   → role pill + "Dashboard →" | "Contribute"
 *
 * The home search is submitted through the existing server-side repository query.
 */
import Image from "next/image";
import Link from "next/link";
import { FilePlus2, Search } from "lucide-react";
import type { UserRole } from "@/lib/auth/auth-contract";
import { AuthInterceptModal } from "@/app/(auth)/_components/auth-intercept-modal";
import { RoleIndicator } from "@/app/(auth)/_components/role-indicator";
import { ThemeToggle } from "@/components/layout/theme-toggle";

interface AppHeaderProps {
  role: UserRole | null;
  query?: string;
  isMySubmissions?: boolean;
}

export function AppHeader({
  role,
  query = "",
  isMySubmissions = false,
}: AppHeaderProps) {
  const isGuest = !role;
  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b border-[var(--color-separator)] bg-[var(--color-bg)]/95 px-6 backdrop-blur-md sm:px-10">

      {/* ── Brand ──────────────────────────────────────────────────────── */}
      <a
        href="/home"
        className="flex shrink-0 items-center gap-2.5 text-[var(--color-text)] no-underline"
        aria-label="Alexandria repository home"
      >
        <Image
          src="/brand/alexandria-mark.svg"
          width={30}
          height={30}
          alt=""
          className="theme-invert"
          priority
        />
        <span className="font-[var(--font-khula)] text-[19px] font-black tracking-tight max-sm:hidden">
          ALEXANDRIA
        </span>
      </a>

      {/* ── Search bar (flush left) ─────────────────────────────────────── */}
      <div className="flex flex-1 justify-start pl-6 pr-4">
        <form action="/home" method="get" className="w-full max-w-lg">
          {isMySubmissions && <input type="hidden" name="mine" value="1" />}
          <label className="relative flex w-full items-center">
            <span className="sr-only">Search theses</span>
            <Search
              size={14}
              className="pointer-events-none absolute left-3 text-[var(--color-text-muted)]"
              aria-hidden
            />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Search Alexandria"
              className="h-8 w-full rounded-md border border-[var(--color-separator)] bg-transparent pl-9 pr-8 text-sm text-[var(--color-text)] placeholder-[var(--color-placeholder)] transition-colors focus:border-[var(--color-brand-bright)]/30 focus:bg-[var(--color-text)]/5 focus:outline-none"
            />
            <div className="pointer-events-none absolute right-2 flex items-center justify-center rounded border border-[var(--color-separator)] bg-[var(--color-text)]/5 px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-muted)]">
              /
            </div>
          </label>
        </form>
      </div>

      {/* ── Right cluster ──────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-3">

        {/* Role identity (always shown) */}
        <RoleIndicator role={role} />

        {/* Separator — only between role chip and a CTA pill */}
        {role && (
          <span className="h-5 w-px bg-[var(--color-separator)]" aria-hidden="true" />
        )}

        {/* Primary CTA — contextual by role */}
        {isGuest && <AuthInterceptModal />}

        {!isGuest && (
          <Link
            href="/upload"
            className="inline-flex h-9 items-center gap-2 justify-center rounded-full bg-[#368bfe] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2f78ff] active:bg-[#1752f0]"
          >
            <FilePlus2 size={15} aria-hidden />
            Contribute
          </Link>
        )}

        {/* Theme toggle — always last in the right cluster */}
        <ThemeToggle />
      </div>
    </header>
  );
}
