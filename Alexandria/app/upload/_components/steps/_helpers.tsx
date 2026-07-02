"use client";

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

/** Container for a single wizard step's content. */
export function StepWrapper({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-[540px] space-y-7 px-4 sm:px-0">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight text-white">{title}</h2>
        {description && (
          <p className="text-sm leading-relaxed text-white/35">{description}</p>
        )}
      </div>
      <div className="space-y-5">{children}</div>
    </div>
  );
}

/** A labelled form field wrapper with optional hint text. */
export function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-white/35">
        {label}
        {required && <span className="text-[#368BFE]" aria-hidden>*</span>}
      </label>
      {hint && (
        <p className="text-xs text-white/25 leading-relaxed">{hint}</p>
      )}
      {children}
    </div>
  );
}

/** Inline validation error message. */
export function FieldError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-xs text-[#ff6b6b]">
      {children}
    </p>
  );
}

/** Base CSS class string for text inputs and textareas. */
export function inputClass(hasError?: boolean) {
  return cn(
    "h-[42px] w-full rounded-lg border bg-[#0D1117] px-3 text-sm text-white placeholder-white/20 outline-none transition-colors",
    hasError
      ? "border-[#ff6b6b]/50 focus:border-[#ff6b6b]/80"
      : "border-white/8 focus:border-[#368BFE]/60",
  );
}

/** Native <select> wrapped with a custom chevron. */
export function SelectInput({
  hasError,
  children,
  ...props
}: React.ComponentProps<"select"> & { hasError?: boolean }) {
  return (
    <div className="relative">
      <select
        {...props}
        className={cn(
          inputClass(hasError),
          "appearance-none cursor-pointer pr-9",
          "[&>option]:bg-[#1C2026] [&>option]:text-white",
        )}
      >
        {children}
      </select>
      <ChevronDown
        size={13}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/30"
        aria-hidden
      />
    </div>
  );
}
