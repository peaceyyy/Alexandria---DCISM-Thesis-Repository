"use client";

import { useRef, useState, type DragEvent } from "react";
import { Upload, FileText, X, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface PdfDropzoneProps {
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function PdfDropzone({ file, onChange, error }: PdfDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFile(f: File | null) {
    if (!f) return;
    onChange(f);
  }

  function onDragOver(e: DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function onDragLeave(e: DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function onDrop(e: DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0] ?? null;
    handleFile(dropped);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null;
    handleFile(picked);
    e.target.value = "";
  }

  if (file) {
    return (
      /* ── File selected ── */
      <div className="flex items-center gap-4 rounded-xl border border-[#59c987]/20 bg-[#59c987]/5 px-5 py-4">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border border-[#59c987]/15 bg-[#59c987]/8">
          <FileText size={18} className="text-[#59c987]" aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{file.name}</p>
          <p className="mt-0.5 text-xs text-white/35">{formatBytes(file.size)}</p>
        </div>

        <div className="flex items-center gap-3">
          <CircleCheck size={16} className="text-[#59c987]" aria-hidden />
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-white/25 transition-colors hover:text-[#ff6b6b]"
            aria-label="Remove file"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Drop zone ── */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "group flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed py-16 transition-all duration-200",
          isDragging
            ? "border-[#368BFE]/50 bg-[#368BFE]/4"
            : error
              ? "border-[#ff6b6b]/30 bg-[#ff6b6b]/3"
              : "border-white/8 bg-[#0D1117]/40 hover:border-white/15 hover:bg-[#0D1117]/70",
        )}
      >
        {/* Upload icon circle */}
        <div
          className={cn(
            "mb-5 flex h-14 w-14 items-center justify-center rounded-full border transition-all duration-200",
            isDragging
              ? "border-[#368BFE]/35 bg-[#368BFE]/8"
              : error
                ? "border-[#ff6b6b]/25 bg-[#ff6b6b]/5"
                : "border-white/8 bg-white/3 group-hover:border-white/15",
          )}
        >
          <Upload
            size={20}
            aria-hidden
            className={cn(
              "transition-colors duration-200",
              isDragging
                ? "text-[#368BFE]"
                : error
                  ? "text-[#ff6b6b]/50"
                  : "text-white/25 group-hover:text-white/40",
            )}
          />
        </div>

        <p
          className={cn(
            "text-sm font-medium",
            isDragging ? "text-[#368BFE]" : "text-white/50",
          )}
        >
          {isDragging ? "Drop to upload" : "Drop your PDF here"}
        </p>
        <p className="mt-1 text-xs text-white/25">or click to browse</p>
        <p className="mt-4 text-[10px] uppercase tracking-widest text-white/15">
          PDF only · Max 10 MiB
        </p>
      </button>

      {error && (
        <p role="alert" className="text-xs text-[#ff6b6b]">
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={onInputChange}
        aria-label="Upload PDF file"
      />
    </>
  );
}
