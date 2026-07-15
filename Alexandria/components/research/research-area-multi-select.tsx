"use client";

import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { Check, ChevronDown, X } from "lucide-react";
import {
  getResearchAreaLabel,
  RESEARCH_AREAS,
  type ResearchAreaId,
} from "@/lib/domain/research-areas";
import { cn } from "@/lib/utils";

type ResearchAreaMultiSelectProps = {
  value: ResearchAreaId[];
  onChange: (areas: ResearchAreaId[]) => void;
  disabled?: boolean;
  error?: string;
};

export function ResearchAreaMultiSelect({
  value,
  onChange,
  disabled = false,
  error,
}: ResearchAreaMultiSelectProps) {
  const [open, setOpen] = useState(false);
  function toggle(area: ResearchAreaId) {
    onChange(
      value.includes(area)
        ? value.filter((selectedArea) => selectedArea !== area)
        : [...value, area],
    );
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        disabled={disabled}
        aria-label="Select research areas"
        className={cn(
          "flex min-h-[42px] w-full flex-wrap items-center gap-1.5 rounded-md border bg-[var(--color-surface-alt)] px-3 py-2 text-left text-sm text-[var(--color-text)] transition-colors disabled:cursor-not-allowed disabled:opacity-60",
          error
            ? "border-[var(--color-danger)]/50"
            : open
              ? "border-[var(--color-brand-bright)]/40"
              : "border-[var(--color-separator)] hover:border-[var(--color-separator-mid)]",
        )}
      >
        {value.length === 0 ? (
          <span className="flex-1 text-left text-[var(--color-placeholder)]">
            Select research areas...
          </span>
        ) : (
          value.map((area) => (
            <span
              key={area}
              className="flex items-center gap-1 rounded-full border border-[var(--color-chip-cyan-bd)] bg-[var(--color-chip-cyan-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-chip-cyan-text)]"
            >
              {getResearchAreaLabel(area)}
              {!disabled && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(event) => {
                    event.stopPropagation();
                    toggle(area);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      event.stopPropagation();
                      toggle(area);
                    }
                  }}
                  aria-label={`Remove ${getResearchAreaLabel(area)}`}
                  className="cursor-pointer opacity-55 transition-opacity hover:opacity-100"
                >
                  <X size={9} strokeWidth={2.5} aria-hidden />
                </span>
              )}
            </span>
          ))
        )}
        <ChevronDown
          size={12}
          aria-hidden
          className={cn(
            "ml-auto flex-shrink-0 text-[var(--color-text-muted)] opacity-50 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner
          align="start"
          side="bottom"
          sideOffset={6}
          collisionPadding={16}
          collisionAvoidance={{ side: "flip", align: "shift", fallbackAxisSide: "none" }}
        >
          <Popover.Popup
            aria-label="Research areas"
            className="z-[60] w-[var(--anchor-width)] overflow-hidden rounded-md border border-[var(--color-separator-mid)] bg-[var(--color-surface)] p-1 text-[var(--color-text)] shadow-lg outline-none data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
          >
          <ul role="listbox" aria-multiselectable="true" className="max-h-56 overflow-y-auto py-1">
            {RESEARCH_AREAS.map((area) => {
              const selected = value.includes(area.id);
              return (
                <li key={area.id} role="option" aria-selected={selected}>
                  <button
                    type="button"
                    onClick={() => toggle(area.id)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-colors",
                      selected
                        ? "bg-[var(--color-chip-cyan-bg)] text-[var(--color-chip-cyan-text)]"
                        : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-3 w-3 flex-shrink-0 items-center justify-center rounded-[3px] border transition-colors",
                        selected
                          ? "border-[var(--color-brand)] bg-[var(--color-brand)]"
                          : "border-[var(--color-separator-mid)]",
                      )}
                    >
                      {selected && <Check size={8} strokeWidth={3} className="text-white" aria-hidden />}
                    </span>
                    {area.label}
                  </button>
                </li>
              );
            })}
          </ul>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>

      {error && (
        <p role="alert" className="mt-1.5 text-xs text-[var(--color-danger)]">
          {error}
        </p>
      )}
    </Popover.Root>
  );
}
