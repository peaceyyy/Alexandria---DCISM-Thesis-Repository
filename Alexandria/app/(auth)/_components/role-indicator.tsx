import Link from "next/link";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/lib/auth/auth-contract";
import { getPostAuthDestination } from "@/lib/auth/auth-routing";
import { getRoleDisplay } from "@/lib/auth/role-display";

export function RoleIndicator({
  role,
  className,
  iconOnly = false,
  stretch = false,
}: {
  role?: UserRole | null;
  className?: string;
  iconOnly?: boolean;
  stretch?: boolean;
}) {
  const display = getRoleDisplay(role);
  const isPrivileged = role === "admin" || role === "moderator";

  /* Icon-only: just the abbreviation circle, centred, no label or dashboard link. */
  if (iconOnly) {
    return (
      <Link
        href={role ? "/profile" : "/login"}
        draggable={false}
        onDragStart={(event) => event.preventDefault()}
        aria-label={`Current access role: ${display.label}`}
        title={display.label}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border ${display.className} transition-colors hover:brightness-125`}
      >
        <span
          aria-hidden="true"
          className="grid h-6 w-6 place-items-center rounded-full bg-black/20 text-[10px] font-black"
        >
          {display.abbreviation}
        </span>
      </Link>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", stretch && "w-full", className)}>
      {/* Role pill → links to profile */}
      <Link
        href={role ? "/profile" : "/login"}
        draggable={false}
        onDragStart={(event) => event.preventDefault()}
        aria-label={`Current access role: ${display.label}`}
        title={`Current access role: ${display.label}`}
        className={cn(
          "inline-flex min-h-8 items-center gap-2 rounded-full border px-2.5 pr-3 text-xs font-semibold transition-colors hover:brightness-125",
          display.className,
          stretch && "flex-1 min-w-0",
        )}
      >
        <span
          aria-hidden="true"
          className="grid h-6 min-w-6 place-items-center rounded-full bg-black/20 px-1 text-[10px] font-black flex-shrink-0"
        >
          {display.abbreviation}
        </span>
        <span className="truncate">{display.label}</span>
      </Link>

      {/* Dashboard shortcut — only for admin and moderator */}
      {isPrivileged && (
        <Link
          href={getPostAuthDestination(role)}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[var(--color-brand-bright)]/40 bg-[var(--color-brand-bright)]/10 px-3 text-xs font-semibold text-[var(--color-brand-bright)] transition-colors hover:bg-[var(--color-brand-bright)]/20"
          aria-label="Go to your dashboard"
        >
          Dashboard →
        </Link>
      )}
    </div>
  );
}
