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

// ─── Single draggable lesson item ────────────────────────────────────────────

function LessonItem({
  id,
  text,
  onRemove,
}: {
  id: string;
  text: string;
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
      className="group flex items-center gap-2 rounded-md border border-white/6 bg-[#14181C] px-3 py-2.5"
    >
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="flex-shrink-0 touch-none cursor-grab text-white/18 hover:text-white/45 transition-colors"
        aria-label="Drag to reorder"
        tabIndex={-1}
      >
        <GripVertical size={13} aria-hidden />
      </button>
      <span className="flex-1 text-sm leading-relaxed text-white/70">{text}</span>
      <button
        type="button"
        onClick={onRemove}
        className="flex-shrink-0 text-white/18 opacity-0 transition-all hover:text-[#ff6b6b] group-hover:opacity-100"
        aria-label="Remove this lesson"
      >
        <X size={12} strokeWidth={2.5} aria-hidden />
      </button>
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
}

export function LessonsModal({ value, onChange, error }: LessonsModalProps) {
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
          "group relative w-full rounded-lg border bg-[#0D1117] px-4 py-3.5 text-left transition-all",
          error && !open
            ? "border-[#ff6b6b]/50"
            : hasContent
              ? "border-white/8 hover:border-white/15"
              : "border-dashed border-white/8 hover:border-[#368BFE]/40",
        )}
        aria-label={`${hasContent ? "Edit" : "Add"} lessons learned`}
      >
        {hasContent ? (
          <div className="space-y-2">
            <p className="text-[10px] font-medium text-white/30">
              {value.length} lesson{value.length > 1 ? "s" : ""} ·{" "}
              <span className="text-[#368BFE]/80">click to edit</span>
            </p>
            <ul className="space-y-1">
              {value.slice(0, 3).map((lesson, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/50">
                  <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-[#368BFE]/40" />
                  <span className="line-clamp-1">{lesson}</span>
                </li>
              ))}
              {value.length > 3 && (
                <li className="pl-3 text-xs text-white/25">
                  +{value.length - 3} more…
                </li>
              )}
            </ul>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-white/25">
            <Edit3 size={13} aria-hidden />
            <span className="text-sm">Click to add lessons learned…</span>
          </div>
        )}
        <span className="absolute right-3.5 top-3.5 opacity-0 transition-opacity group-hover:opacity-50">
          <Edit3 size={13} className="text-white" aria-hidden />
        </span>
      </button>

      {error && !open && (
        <p role="alert" className="text-xs text-[#ff6b6b]">{error}</p>
      )}

      {/* ─── Modal ─────────────────────────────────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={handleDiscard}
            aria-hidden
          />

          <div className="relative z-10 flex w-full max-w-xl flex-col rounded-xl border border-white/8 bg-[#1C2026] shadow-2xl shadow-black/70">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
              <div className="flex items-center gap-2">
                <ListChecks size={14} className="text-[#368BFE]" aria-hidden />
                <span className="text-sm font-semibold text-white">Lessons Learned</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs tabular-nums text-white/25">
                  {entries.length} {entries.length === 1 ? "entry" : "entries"}
                </span>
                <button
                  type="button"
                  onClick={handleDiscard}
                  className="text-white/25 transition-colors hover:text-white"
                  aria-label="Discard and close"
                >
                  <X size={15} aria-hidden />
                </button>
              </div>
            </div>

            {/* Guidance strip */}
            <div className="flex items-start gap-2 border-b border-white/5 bg-[#368BFE]/5 px-5 py-3">
              <Lightbulb
                size={13}
                className="mt-0.5 flex-shrink-0 text-[#368BFE]/60"
                aria-hidden
              />
              <p className="text-xs leading-relaxed text-[#368BFE]/60">
                One clear, actionable insight per entry. Think: what would you tell yourself before
                starting? Keep it brief. Drag handle (
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
                          onRemove={() => removeEntry(entry.id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              {/* Input row */}
              <div className="flex items-center gap-2 rounded-lg border border-white/8 bg-[#14181C] px-3 py-2 outline-none transition-colors focus-within:border-[#368BFE]/50">
                <Plus size={12} className="flex-shrink-0 text-white/20" aria-hidden />
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Type a lesson and press Enter to add…"
                  maxLength={220}
                  className="flex-1 bg-transparent text-sm text-white placeholder-white/20 outline-none"
                />
                {input.trim() && (
                  <button
                    type="button"
                    onClick={addLesson}
                    className="rounded bg-[#1752F0]/80 px-2 py-0.5 text-xs text-white transition-colors hover:bg-[#368BFE]"
                  >
                    Add
                  </button>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-white/5 px-5 py-4">
              <button
                type="button"
                onClick={handleDiscard}
                className="rounded-md border border-white/8 px-4 py-1.5 text-sm text-white/50 transition-colors hover:border-white/15 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={entries.length === 0}
                className="rounded-md bg-[#1752F0] px-4 py-1.5 text-sm text-white transition-colors hover:bg-[#368BFE] disabled:cursor-not-allowed disabled:opacity-35"
              >
                Save{entries.length > 0 ? ` (${entries.length})` : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
