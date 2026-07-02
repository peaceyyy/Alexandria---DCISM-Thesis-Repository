"use client";

import { useState, useRef, useEffect } from "react";
import { X, Edit3, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minLength?: number;
  hint?: string;
  error?: string;
}

/**
 * Displays a clickable text preview. On click, opens a full-screen blurred
 * modal with a large textarea for unobstructed editing.
 * Used for Abstract and Recommendations.
 */
export function ModalEditor({
  label,
  value,
  onChange,
  placeholder,
  minLength,
  hint,
  error,
}: ModalEditorProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Keep draft in sync when the modal is closed
  useEffect(() => {
    if (!open) setDraft(value);
  }, [value, open]);

  // Focus the textarea after the modal animates in
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => textareaRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Escape key closes and discards
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleDiscard();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleOpen() {
    setDraft(value);
    setOpen(true);
  }

  function handleSave() {
    onChange(draft.trim());
    setOpen(false);
  }

  function handleDiscard() {
    setDraft(value);
    setOpen(false);
  }

  const hasContent = value.trim().length > 0;
  const charCount = draft.length;
  const meetsMin = minLength ? charCount >= minLength : true;
  const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0;

  return (
    <>
      {/* Preview / trigger card */}
      <button
        type="button"
        onClick={handleOpen}
        className={cn(
          "group relative w-full rounded-lg border bg-[#0D1117] px-4 py-3.5 text-left transition-all",
          error && !open
            ? "border-[#ff6b6b]/50"
            : hasContent
              ? "border-white/8 hover:border-white/15"
              : "border-dashed border-white/8 hover:border-[#368BFE]/40",
        )}
        aria-label={`${hasContent ? "Edit" : "Add"} ${label}`}
      >
        {hasContent ? (
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium text-white/30">
              {wordCount} words ·{" "}
              <span className="text-[#368BFE]/80">click to edit</span>
            </p>
            <p className="line-clamp-3 text-sm leading-relaxed text-white/55">
              {value}
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-white/25">
            <Edit3 size={13} aria-hidden />
            <span className="text-sm">Click to write {label.toLowerCase()}…</span>
          </div>
        )}
        {/* Hover edit icon */}
        <span className="absolute right-3.5 top-3.5 opacity-0 transition-opacity group-hover:opacity-50">
          <Edit3 size={13} className="text-white" aria-hidden />
        </span>
      </button>

      {error && !open && (
        <p role="alert" className="text-xs text-[#ff6b6b]">{error}</p>
      )}

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={handleDiscard}
            aria-hidden
          />

          {/* Panel */}
          <div className="relative z-10 flex w-full max-w-2xl flex-col rounded-xl border border-white/8 bg-[#1C2026] shadow-2xl shadow-black/70">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
              <div className="flex items-center gap-2">
                <FileText size={14} className="text-[#368BFE]" aria-hidden />
                <span className="text-sm font-semibold text-white">{label}</span>
              </div>
              <div className="flex items-center gap-4">
                {minLength && (
                  <span
                    className={cn(
                      "text-xs tabular-nums transition-colors",
                      meetsMin ? "text-[#59c987]" : "text-white/25",
                    )}
                  >
                    {charCount} / {minLength}+ chars
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleDiscard}
                  aria-label="Discard and close editor"
                  className="text-white/25 transition-colors hover:text-white"
                >
                  <X size={15} aria-hidden />
                </button>
              </div>
            </div>

            {/* Hint strip */}
            {hint && (
              <div className="border-b border-white/5 bg-[#368BFE]/5 px-5 py-2.5">
                <p className="text-xs text-[#368BFE]/60 leading-relaxed">{hint}</p>
              </div>
            )}

            {/* Textarea */}
            <div className="px-5 py-4" style={{ maxHeight: "60vh", overflowY: "auto" }}>
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={placeholder}
                rows={16}
                className="w-full resize-none bg-transparent text-sm leading-relaxed text-white placeholder-white/18 outline-none"
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-white/5 px-5 py-4">
              <button
                type="button"
                onClick={handleDiscard}
                className="rounded-lg border border-white/8 px-4 py-1.5 text-sm text-white/50 transition-colors hover:border-white/15 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!meetsMin}
                className="rounded-lg bg-[#1752F0] px-4 py-1.5 text-sm text-white transition-colors hover:bg-[#368BFE] disabled:cursor-not-allowed disabled:opacity-35"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
