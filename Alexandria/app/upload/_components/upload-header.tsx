"use client";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AlexandriaBrandLockup } from "@/components/ui/alexandria-brand-lockup";

interface UploadHeaderProps {
  onLogoClick: () => void;
}

export function UploadHeader({ onLogoClick }: UploadHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[var(--color-separator)] bg-[var(--color-bg)]/95 px-6 backdrop-blur-md sm:px-10">
      {/* Brand — intercepted for exit warning when form is dirty */}
      <button
        type="button"
        onClick={onLogoClick}
        className="flex h-10 items-center gap-2.5 text-[var(--color-text)] transition-opacity hover:opacity-75"
        aria-label="Return to Alexandria repository"
      >
        <AlexandriaBrandLockup
          markSize={28}
          wordmarkClassName="text-[20px] font-black"
          priority
        />
      </button>

      {/* Theme */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
      </div>
    </header>
  );
}
