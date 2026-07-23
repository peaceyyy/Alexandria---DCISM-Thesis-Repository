import Link from "next/link";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AlexandriaBrandLockup } from "@/components/ui/alexandria-brand-lockup";
import { BackLink } from "@/components/ui/back-link";

/** A deliberately narrow header for task flows that should not expose browse controls. */
export function TaskHeader({
  backHref,
  backLabel,
}: {
  backHref: string;
  backLabel: string;
}) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[var(--color-separator)] bg-[var(--color-bg)]/95 px-4 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center gap-4">
        <Link
          href="/home"
          className="shrink-0 text-[var(--color-text)]"
          aria-label="Alexandria repository home"
        >
          <AlexandriaBrandLockup
            markSize={26}
            wordmarkClassName="hidden text-[18px] font-black sm:inline"
          />
        </Link>
        <BackLink
          href={backHref}
          label={backLabel}
          className="min-w-0"
        />
      </div>
      <ThemeToggle />
    </header>
  );
}
