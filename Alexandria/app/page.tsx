import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MinimalHeader } from "@/components/layout/minimal-header";

export default function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#14181c] text-white">
      <MinimalHeader />

      {/* Hero section */}
      <section className="relative z-10 flex min-h-[calc(100vh-64px)] max-w-7xl flex-col px-6 pb-28 pt-16 sm:px-10 lg:px-16">
        <div className="max-w-4xl">
          {/* Wordmark */}
          <div className="flex flex-nowrap items-end gap-x-4 gap-y-2">
            <h1 className="shrink-0 whitespace-nowrap font-[var(--font-khula)] text-[clamp(4rem,8vw,7.5rem)] font-extrabold leading-none tracking-[-0.06em] bg-[conic-gradient(from_180deg_at_50%_50%,#368bfe_0deg,#1752f0_180deg,#368bfe_360deg)] bg-clip-text text-transparent">
              ALEXANDRIA
            </h1>
            <span className="pb-3 text-sm font-medium text-[#ffd900] sm:text-base whitespace-nowrap">
              (al-ig-ZAN-dree-uh)
            </span>
          </div>

          <h2 className="max-w-none whitespace-nowrap text-[clamp(2.25rem,4vw,3.45rem)] font-black leading-[0.95] tracking-[-0.04em] text-white">
            Thesis, Research, and Capstone Hub
          </h2>

          <p className="mt-6 text-xl font-semibold text-[#969696] sm:text-[28px]">
            by DCISM Students, for DCISM Students
          </p>

          <div className="mt-12 flex flex-wrap gap-3">
            <Link
              href="/home"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#368bfe] px-8 text-base font-semibold text-white transition-colors hover:bg-[#2f78ff]"
            >
              Browse
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* Wave decoration */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[32vh]">
        <Image
          src="/landing-waves.svg"
          alt=""
          fill
          priority
          className="object-cover object-bottom"
        />
      </div>
    </main>
  );
}
