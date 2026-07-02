"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { RESEARCH_AREAS } from "@/lib/upload/schema";

interface ResearchAreaPopupProps {
  value: string[];
  onChange: (areas: string[]) => void;
  error?: string;
}

export function ResearchAreaPopup({ value, onChange, error }: ResearchAreaPopupProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function toggle(area: string) {
    if (value.includes(area)) {
      onChange(value.filter((a) => a !== area));
    } else {
      onChange([...value, area]);
    }
  }

  const selectedCount = value.length;

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger — chips live inside it, not below */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex min-h-[42px] w-full flex-wrap items-center gap-1.5 rounded-lg border bg-[#0D1117] px-3 py-2 text-sm transition-colors",
          error
            ? "border-[#ff6b6b]/50"
            : open
              ? "border-[#368BFE]/60"
              : "border-white/8 hover:border-white/15",
        )}
      >
        {selectedCount === 0 ? (
          <span className="flex-1 text-left text-white/20">Select research areas…</span>
        ) : (
          <>
            {value.map((area) => (
              <span
                key={area}
                className="flex items-center gap-1 rounded-full border border-[#1752F0]/25 bg-[#1752F0]/12 px-2 py-0.5 text-[11px] font-medium text-[#368BFE]"
              >
                {area}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); toggle(area); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); toggle(area); } }}
                  aria-label={`Remove ${area}`}
                  className="cursor-pointer text-[#368BFE]/50 transition-colors hover:text-[#368BFE]"
                >
                  <X size={9} strokeWidth={2.5} aria-hidden />
                </span>
              </span>
            ))}
          </>
        )}
        <ChevronDown
          size={12}
          aria-hidden
          className={cn(
            "ml-auto flex-shrink-0 text-white/25 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Floating panel — capped height, scrollable */}
      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 z-50 w-full overflow-hidden rounded-lg border border-white/8 bg-[#1C2026] shadow-2xl shadow-black/60">
          <ul
            role="listbox"
            aria-multiselectable="true"
            className="max-h-48 overflow-y-auto py-1"
          >
            {RESEARCH_AREAS.map((area) => {
              const selected = value.includes(area);
              return (
                <li key={area} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    onClick={() => toggle(area)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-colors",
                      selected
                        ? "bg-[#1752F0]/12 text-[#368BFE]"
                        : "text-white/55 hover:bg-white/4 hover:text-white",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-3 w-3 flex-shrink-0 items-center justify-center rounded-[3px] border transition-colors",
                        selected ? "border-[#1752F0] bg-[#1752F0]" : "border-white/20",
                      )}
                    >
                      {selected && (
                        <Check size={8} strokeWidth={3} className="text-white" aria-hidden />
                      )}
                    </span>
                    {area}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-1.5 text-xs text-[#ff6b6b]">
          {error}
        </p>
      )}
    </div>
  );
}
