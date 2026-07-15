"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Reads ?submitted=1 from the URL and shows a premium floating toast.
 * Auto-dismisses after 5 seconds with a smooth animation.
 */
export function SubmissionBanner() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [kind, setKind] = useState<"submitted" | "resubmitted" | null>(null);

  useEffect(() => {
    const nextKind =
      params.get("resubmitted") === "1"
        ? "resubmitted"
        : params.get("submitted") === "1"
          ? "submitted"
          : null;

    if (nextKind) {
      const nextParams = new URLSearchParams(params.toString());
      nextParams.delete("submitted");
      nextParams.delete("resubmitted");

      setKind(nextKind);
      setVisible(true);
      router.replace(
        nextParams.size ? `${pathname}?${nextParams.toString()}` : pathname,
        { scroll: false },
      );
    }
  }, [params, pathname, router]);

  // Auto-dismiss logic
  useEffect(() => {
    if (visible && !isExiting) {
      const timer = setTimeout(() => {
        setIsExiting(true);
      }, 5000); // 5 seconds visible
      return () => clearTimeout(timer);
    }
  }, [visible, isExiting]);

  // Clean up completely after exit animation finishes
  useEffect(() => {
    if (isExiting) {
      const timer = setTimeout(() => {
        setVisible(false);
        setIsExiting(false);
      }, 300); // matches the tailwind animate-out duration
      return () => clearTimeout(timer);
    }
  }, [isExiting]);

  if (!visible) return null;

  const isResubmitted = kind === "resubmitted";

  return (
    <div
      className={cn(
        "fixed z-50 flex pointer-events-none px-4",
        isResubmitted
          ? "bottom-5 right-0 justify-end"
          : "left-0 right-0 top-24 justify-center",
      )}
    >
      <div
        role="status"
        aria-live="polite"
        className={cn(
          "pointer-events-auto flex items-center gap-3 overflow-hidden border border-[#34d399]/25 bg-[#14181C] py-2.5 pl-3 pr-4 text-sm shadow-2xl shadow-[#34d399]/10 transition-all",
          isResubmitted ? "w-full max-w-sm rounded-md" : "rounded-full",
          isExiting
            ? "animate-out fade-out duration-300 fill-mode-forwards"
            : "animate-in fade-in zoom-in-95 duration-500 ease-out",
          isResubmitted &&
            (isExiting ? "slide-out-to-right-4" : "slide-in-from-right-4"),
          !isResubmitted &&
            (isExiting ? "slide-out-to-top-4" : "slide-in-from-top-4"),
        )}
      >
        {/* Icon wrapper */}
        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#34d399]/10">
          <CheckCircle2 size={16} className="text-[#34d399]" aria-hidden />
        </div>

        {/* Messaging */}
        <p className="text-white/90">
          <span className="font-semibold text-white">
            {isResubmitted ? "Submitted for review." : "Thesis submitted!"}
          </span>{" "}
          <span className="text-white/60">
            {isResubmitted
              ? "Editing is locked until it is flagged again."
              : "Pending moderator review."}
          </span>
        </p>

        {/* Divider */}
        <div className="ml-2 h-4 w-px bg-white/10" />

        {/* Close Button */}
        <button
          type="button"
          onClick={() => setIsExiting(true)}
          aria-label="Dismiss"
          className="flex h-6 w-6 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X size={14} aria-hidden />
        </button>
      </div>
    </div>
  );
}
