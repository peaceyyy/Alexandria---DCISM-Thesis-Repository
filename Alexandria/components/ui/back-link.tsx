import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface BackLinkProps {
  href: string;
  label: string;
  compact?: boolean;
  className?: string;
}

/** A return affordance for ordinary navigation; guarded workspaces keep local control. */
export function BackLink({ href, label, compact = false, className }: BackLinkProps) {
  return (
    <Link
      href={href}
      aria-label={compact ? label : undefined}
      title={compact ? label : undefined}
      className={cn(
        "inline-flex min-h-9 items-center gap-2 rounded-md px-2 text-sm font-semibold text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-text)]/[0.06] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-bright)]/30",
        compact && "size-8 min-h-8 justify-center gap-0 p-0",
        className,
      )}
    >
      <ArrowLeft size={15} aria-hidden />
      {!compact && <span className="truncate">{label}</span>}
    </Link>
  );
}
