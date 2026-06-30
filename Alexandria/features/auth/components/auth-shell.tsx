import { GitFork } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./auth-shell.module.css";
import { ThemeToggle } from "./theme-toggle";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className={styles.shell}>
      <div className={styles.orbits} aria-hidden>
        <span className={`${styles.orbit} ${styles.orbitOuter}`} />
        <span className={`${styles.orbit} ${styles.orbitMiddle}`} />
        <span className={`${styles.orbit} ${styles.orbitInner}`} />
      </div>

      <div className="absolute top-12 right-11 z-10 flex items-center gap-4 max-sm:top-5 max-sm:right-5">
        <ThemeToggle />
        <a
          href="https://github.com/peaceyyy/Alexandria---DCISM-Thesis-Repository"
          target="_blank"
          rel="noreferrer"
          aria-label="Open Alexandria on GitHub"
          className="grid size-12 place-items-center rounded-full bg-white text-[#14181c]"
        >
          <GitFork aria-hidden size={26} />
        </a>
      </div>

      <section className={styles.content}>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[var(--color-text)]"
        >
          <Image
            src="/brand/alexandria-mark.svg"
            width={56}
            height={56}
            alt=""
            priority
          />
          <span className="text-[25px] font-black max-sm:hidden">
            ALEXANDRIA
          </span>
        </Link>

        <header className="mt-5 max-w-[854px]">
          <div className="flex items-end gap-3">
            <h1 className="font-[var(--font-display)] text-[clamp(4rem,7vw,6.25rem)] leading-none font-extrabold text-[#368bfe]">
              ALEXANDRIA
            </h1>
            <span className="mb-3 text-[15px] text-[#ffd900] max-md:hidden">
              (al-ig-ZAN-dree-uh)
            </span>
          </div>
          <p className="text-[clamp(1.65rem,2.45vw,2.2rem)] leading-tight font-black text-[var(--color-text)]">
            Thesis, Research, and Capstone Hub
          </p>
          <p className="mt-2 text-xl font-semibold text-[var(--color-text-muted)]">
            by DCISM Students, for DCISM Students
          </p>
        </header>

        <div className={styles.formSlot}>{children}</div>
      </section>
    </main>
  );
}
