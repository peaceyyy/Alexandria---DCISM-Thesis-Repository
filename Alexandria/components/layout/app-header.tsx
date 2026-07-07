/**
 * AppHeader — the shared header for all content pages (/theses, etc.)
 *
 * Layout (left → right):
 *   [Logo mark + wordmark]  [────── Search bar ──────]  [Role/Dashboard group | Contribute]
 *
 * Right cluster behaviour by role:
 *   • Guest   → role pill (→ /login)  |  separator  |  "Sign In" (intercept modal)
 *   • Member  → role pill (→ /profile) |  separator  |  "Contribute" (→ /submit)
 *   • Mod     → role pill  +  "Dashboard →"  (no Contribute — mods don't submit)
 *   • Admin   → role pill  +  "Dashboard →"  (no Contribute — admins don't submit)
 *
 * The search input is a placeholder skeleton for now; the
 * real search handler will be wired in the repository browsing feature phase.
 */
import Image from "next/image";
import Link from "next/link";
import { Search } from "lucide-react";
import type { UserRole } from "@/lib/auth/auth-contract";
import { AuthInterceptModal } from "@/app/(auth)/_components/auth-intercept-modal";
import { RoleIndicator } from "@/app/(auth)/_components/role-indicator";

interface AppHeaderProps {
  role: UserRole | null;
}

export function AppHeader({ role }: AppHeaderProps) {
  const isGuest = !role;
  const isPrivileged = role === "admin" || role === "moderator";

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b border-[#d9d9d9]/15 bg-[#14181c]/95 px-6 backdrop-blur-md sm:px-10">

      {/* ── Brand ──────────────────────────────────────────────────────── */}
      <a
        href="/theses"
        className="flex shrink-0 items-center gap-2.5 text-white no-underline"
        aria-label="Alexandria repository home"
      >
        <Image
          src="/brand/alexandria-mark.svg"
          width={30}
          height={30}
          alt=""
          priority
        />
        <span className="font-[var(--font-khula)] text-[19px] font-black tracking-tight max-sm:hidden">
          ALEXANDRIA
        </span>
      </a>

      {/* ── Search bar (flush left) ─────────────────────────────────────── */}
      <div className="flex flex-1 justify-start pl-6 pr-4">
        <label className="relative flex w-full max-w-lg items-center">
          <span className="sr-only">Search theses</span>
          <Search
            size={14}
            className="pointer-events-none absolute left-3 text-[#969696]"
            aria-hidden
          />
          <input
            type="search"
            name="q"
            placeholder="Search Alexandria"
            className="h-8 w-full rounded-md border border-[#d9d9d9]/20 bg-transparent pl-9 pr-8 text-sm text-white placeholder-[#969696] transition-colors focus:border-[#368bfe]/60 focus:bg-white/5 focus:outline-none"
          />
          <div className="pointer-events-none absolute right-2 flex items-center justify-center rounded border border-[#d9d9d9]/20 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-[#969696]">
            /
          </div>
        </label>
      </div>

      {/* ── Right cluster ──────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-center gap-3">

        {/* Role identity (always shown) */}
        <RoleIndicator role={role} />

        {/* Separator — only between role chip and a CTA pill */}
        {!isPrivileged && (
          <span className="h-5 w-px bg-[#d9d9d9]/20" aria-hidden="true" />
        )}

        {/* Primary CTA — contextual by role */}
        {isGuest && <AuthInterceptModal />}

        {!isGuest && !isPrivileged && (
          <Link
            href="/upload"
            className="inline-flex h-9 items-center justify-center rounded-full bg-[#368bfe] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#2f78ff] active:bg-[#1752f0]"
          >
            Contribute
          </Link>
        )}
        {/* Privileged users: Dashboard → is already rendered inside RoleIndicator */}
      </div>
    </header>
  );
}
