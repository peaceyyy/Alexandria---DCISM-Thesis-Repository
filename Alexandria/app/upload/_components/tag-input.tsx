"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  error?: string;
}

export function TagInput({
  value,
  onChange,
  placeholder = "Type a keyword and press Enter…",
  error,
}: TagInputProps) {
  const [input, setInput] = useState("");

  function addTag(raw: string) {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, "-");
    if (!tag || value.includes(tag)) return;
    onChange([...value, tag]);
    setInput("");
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && input === "" && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-lg border bg-[#0D1117] px-3 py-2 outline-none transition-colors",
          error
            ? "border-[#ff6b6b]/50 focus-within:border-[#ff6b6b]/80"
            : "border-white/8 focus-within:border-[#368BFE]/60",
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full border border-[#1DA0C9]/25 bg-[#1DA0C9]/12 px-2.5 py-0.5 text-xs font-medium text-[#1DA0C9]"
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`Remove keyword ${tag}`}
              className="ml-0.5 text-[#1DA0C9]/50 transition-colors hover:text-[#1DA0C9]"
            >
              <X size={10} strokeWidth={2.5} aria-hidden />
            </button>
          </span>
        ))}

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          className="min-w-[140px] flex-1 bg-transparent text-sm text-white placeholder-white/20 outline-none"
        />
      </div>

      {error && (
        <p role="alert" className="text-xs text-[#ff6b6b]">
          {error}
        </p>
      )}
    </div>
  );
}
