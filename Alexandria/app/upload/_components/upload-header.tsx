"use client";

import Image from "next/image";
import { User } from "lucide-react";

interface UploadHeaderProps {
  onLogoClick: () => void;
}

export function UploadHeader({ onLogoClick }: UploadHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/5 bg-[#14181C]/95 px-6 backdrop-blur-md sm:px-10">
      {/* Brand — intercepted for exit warning when form is dirty */}
      <button
        type="button"
        onClick={onLogoClick}
        className="flex items-center gap-2 text-white transition-opacity hover:opacity-75"
        aria-label="Return to Alexandria repository"
      >
        <Image
          src="/brand/alexandria-mark.svg"
          width={26}
          height={26}
          alt=""
          priority
        />
        <span
          className="text-[17px] font-black tracking-tight"
          style={{ fontFamily: "var(--font-khula)" }}
        >
          ALEXANDRIA
        </span>
      </button>

      {/* Context label + profile */}
      <div className="flex items-center gap-4">
        <span className="hidden text-[10px] font-semibold uppercase tracking-widest text-white/20 sm:block">
          Submission
        </span>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/40 transition-all hover:border-white/25 hover:text-white/70"
          aria-label="Profile"
        >
          <User size={14} aria-hidden />
        </button>
      </div>
    </header>
  );
}
