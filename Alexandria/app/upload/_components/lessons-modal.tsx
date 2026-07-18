"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X, GripVertical, Plus, Lightbulb, Edit3, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { LESSON_MAX_LENGTH } from "@/lib/domain/lessons";

// ─── Single draggable lesson item ────────────────────────────────────────────

function LessonItem({
  id,
  text,
  readOnly,
  onChange,
  onRemove,
}: {
  id: string;
  text: string;
  readOnly: boolean;
  onChange: (text: string) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      className="group flex items-center gap-2 rounded-md border border-[var(--color-separator-mid)] bg-[var(--color-bg)] px-3 py-2.5"
    >
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="flex-shrink-0 touch-none cursor-grab text-[var(--color-text-muted)] opacity-50 hover:opacity-100 transition-colors"
        aria-label="Drag to reorder"
        tabIndex={-1}
      >
        <GripVertical size={13} aria-hidden />
      </button>
      <div className="min-w-0 flex-1">
        <input
          value={text}
          maxLength={LESSON_MAX_LENGTH}
          readOnly={readOnly}
          onChange={(event) => onChange(event.target.value)}
          aria-label="Lesson learned"
          className="w-full bg-transparent text-sm leading-relaxed text-[var(--color-text)] outline-none"
        />
        <p className="mt-1 text-[10px] tabular-nums text-[var(--color-text-muted)]">
          {text.length} / {LESSON_MAX_LENGTH}
        </p>
      </div>
      {!readOnly && (
        <button
          type="button"
          onClick={onRemove}
          className="flex-shrink-0 text-[var(--color-text-muted)] opacity-0 transition-all hover:text-[var(--color-danger)] group-hover:opacity-100"
          aria-label="Remove this lesson"
        >
          <X size={12} strokeWidth={2.5} aria-hidden />
        </button>
      )}
    </div>
  );
}

// ─── Lesson entry type ────────────────────────────────────────────────────────

interface LessonEntry {
  id: string;
  text: string;
}

// ─── Main lessons modal ───────────────────────────────────────────────────────

interface LessonsModalProps {
  value: string[];
  onChange: (lessons: string[]) => void;
  error?: string;
  readOnly?: boolean;
}

export function LessonsModal({
  value,
  onChange,
  error,
  readOnly = false,
}: LessonsModalProps) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<LessonEntry[]>([]);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  // Sync entries from external value when modal opens
  function openModal() {
    setEntries(value.map((text) => ({ id: crypto.randomUUID(), text })));
    setInput("");
    setOpen(true);
  }

  function handleDiscard() {
    setOpen(false);
    setInput("");
  }

  function handleSave() {
    onChange(entries.map((e) => e.text).filter(Boolean));
    setOpen(false);
    setInput("");
  }

  // Escape → discard
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleDiscard();
    }
    if (open) window.addEventListener("keydown", onKey as any);
    return () => window.removeEventListener("keydown", onKey as any);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Auto-focus input after modal opens
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open]);

  function addLesson() {
    const text = input.trim();
    if (!text) return;
    setEntries((prev) => [...prev, { id: crypto.randomUUID(), text }]);
    setInput("");
    inputRef.current?.focus();
  }

  function handleInputKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addLesson();
    }
  }

  function removeEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  function updateEntry(id: string, text: string) {
    setEntries((prev) =>
      prev.map((entry) => (entry.id === id ? { ...entry, text } : entry)),
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setEntries((prev) => {
      const oldIndex = prev.findIndex((e) => e.id === active.id);
      const newIndex = prev.findIndex((e) => e.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  const hasContent = value.length > 0;

  return (
    <>
      {/* Preview trigger */}
      <button
        type="button"
        onClick={openModal}
        className={cn(
          "group relative w-full rounded-lg border bg-[var(--color-surface)] px-4 py-3.5 text-left transition-all",
          error && !open
            ? "border-[var(--color-danger)]/50"
            : hasContent
              ? "border-[var(--color-separator)] hover:border-[var(--color-separator-mid)]"
              : "border-dashed border-[var(--color-separator)] hover:border-[var(--color-brand-bright)]/40",
        )}
        aria-label={`${hasContent ? "Edit" : "Add"} lessons learned`}
      >
        {hasContent ? (
          <div className="space-y-2">
            <p className="text-[10px] font-medium text-[var(--color-text-muted)]">
              {value.length} lesson{value.length > 1 ? "s" : ""} ·{" "}
              <span className="text-[var(--color-brand-bright)]">
                click to {readOnly ? "view" : "edit"}
              </span>
            </p>
            <ul className="space-y-1">
              {value.slice(0, 3).map((lesson, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-text-muted)]">
                  <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-[var(--color-brand-bright)]/40" />
                  <span className="line-clamp-1 text-[var(--color-text)]">{lesson}</span>
                </li>
              ))}
              {value.length > 3 && (
                <li className="pl-3 text-xs text-[var(--color-text-muted)] opacity-70">
                  +{value.length - 3} more…
                </li>
              )}
            </ul>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[var(--color-placeholder)]">
            <Edit3 size={13} aria-hidden />
            <span className="text-sm">{readOnly ? "No lessons learned" : "Click to add lessons learned…"}</span>
          </div>
        )}
        <span className="absolute right-3.5 top-3.5 opacity-0 transition-opacity group-hover:opacity-50">
          <Edit3 size={13} className="text-[var(--color-text-muted)]" aria-hidden />
        </span>
      </button>

      {error && !open && (
        <p role="alert" className="text-xs text-[var(--color-danger)] mt-1">{error}</p>
      )}

      {/* ─── Modal ─────────────────────────────────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-[var(--color-bg)]/80 backdrop-blur-sm"
            onClick={handleDiscard}
            aria-hidden
          />

          <div className="relative z-10 flex w-full max-w-xl flex-col rounded-xl border border-[var(--color-separator)] bg-[var(--color-surface)] shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-separator)] px-5 py-4">
              <div className="flex items-center gap-2">
                <ListChecks size={14} className="text-[var(--color-brand-bright)]" aria-hidden />
                <span className="text-sm font-semibold text-[var(--color-text)]">Lessons Learned</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs tabular-nums text-[var(--color-text-muted)] opacity-70">
                  {entries.length} {entries.length === 1 ? "entry" : "entries"}
                </span>
                <button
                  type="button"
                  onClick={handleDiscard}
                  className="text-[var(--color-placeholder)] transition-colors hover:text-[var(--color-text)]"
                  aria-label="Discard and close"
                >
                  <X size={15} aria-hidden />
                </button>
              </div>
            </div>

            {/* Guidance strip */}
            <div className="flex items-start gap-2 border-b border-[var(--color-separator)] bg-[var(--color-brand)]/5 px-5 py-3">
              <Lightbulb
                size={13}
                className="mt-0.5 flex-shrink-0 text-[var(--color-brand-bright)]"
                aria-hidden
              />
              <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">
                One clear, actionable insight per entry. Think: what would you tell yourself before
                starting? Keep it brief and under {LESSON_MAX_LENGTH} characters. Drag handle (
                <GripVertical size={10} className="inline" aria-hidden />
                ) to reorder.
              </p>
            </div>

            {/* List + input */}
            <div
              className="flex-1 space-y-2 overflow-y-auto p-5"
              style={{ maxHeight: "50vh" }}
            >
              {entries.length > 0 && (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={entries.map((e) => e.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {entries.map((entry) => (
                        <LessonItem
                          key={entry.id}
                          id={entry.id}
                          text={entry.text}
                          readOnly={readOnly}
                          onChange={(text) => updateEntry(entry.id, text)}
                          onRemove={() => removeEntry(entry.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              {/* Input row */}
              {!readOnly && (
                <div className="flex items-center gap-2 rounded-lg border border-[var(--color-separator)] bg-[var(--color-bg)] px-3 py-2 outline-none transition-colors focus-within:border-[var(--color-brand-bright)]/30">
                <Plus size={12} className="flex-shrink-0 text-[var(--color-text-muted)] opacity-50" aria-hidden />
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Type a lesson and press Enter to add…"
                  maxLength={LESSON_MAX_LENGTH}
                  className="flex-1 bg-transparent text-sm text-[var(--color-text)] placeholder-[var(--color-placeholder)] outline-none focus:outline-none"
                />
                <span className="text-[10px] tabular-nums text-[var(--color-text-muted)]">
                  {input.length} / {LESSON_MAX_LENGTH}
                </span>
                {input.trim() && (
                  <button
                    type="button"
                    onClick={addLesson}
                    className="rounded bg-[var(--color-brand)] px-2 py-0.5 text-xs text-white transition-colors hover:bg-[var(--color-brand-bright)]"
                  >
                    Add
                  </button>
                )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-[var(--color-separator)] px-5 py-4">
              <button
                type="button"
                onClick={handleDiscard}
                className="rounded-md border border-[var(--color-separator)] px-4 py-1.5 text-sm text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-separator-mid)] hover:text-[var(--color-text)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={readOnly ? handleDiscard : handleSave}
                disabled={!readOnly && entries.length === 0}
                className="rounded-md bg-[var(--color-brand)] px-4 py-1.5 text-sm text-white transition-colors hover:bg-[var(--color-brand-bright)] disabled:cursor-not-allowed disabled:opacity-35"
              >
                {readOnly ? "Done" : `Save${entries.length > 0 ? ` (${entries.length})` : ""}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
