"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

interface DatePickerProps {
  value: string; // "YYYY-MM-DD"
  onChange: (value: string) => void;
  max?: string; // "YYYY-MM-DD"
  error?: boolean;
}

export function DatePicker({ value, onChange, max, error }: DatePickerProps) {
  const today = new Date();
  const maxYear = max ? parseInt(max.slice(0, 4)) : today.getFullYear();
  const minYear = 1990;

  const parsed = value ? new Date(value + "T00:00:00") : null;
  const [year, setYear] = useState<number>(parsed?.getFullYear() ?? today.getFullYear());
  const [month, setMonth] = useState<number>(parsed?.getMonth() ?? today.getMonth()); // 0-indexed
  const [day, setDay] = useState<number | "">(parsed?.getDate() ?? "");

  // Days in the currently selected month/year
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = range(1, daysInMonth);
  const years = range(minYear, maxYear).reverse();

  function emit(y: number, m: number, d: number | "") {
    if (d === "") return; // incomplete — don't write to form yet
    const mm = String(m + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    const candidate = `${y}-${mm}-${dd}`;
    // Clamp to max
    if (max && candidate > max) return;
    onChange(candidate);
  }

  function handleYear(e: React.ChangeEvent<HTMLSelectElement>) {
    const y = parseInt(e.target.value);
    setYear(y);
    // If chosen day exceeds days-in-month for new year, reset day
    const dim = new Date(y, month + 1, 0).getDate();
    const safeDay = typeof day === "number" && day > dim ? "" : day;
    setDay(safeDay);
    emit(y, month, safeDay);
  }

  function handleMonth(e: React.ChangeEvent<HTMLSelectElement>) {
    const m = parseInt(e.target.value);
    setMonth(m);
    const dim = new Date(year, m + 1, 0).getDate();
    const safeDay = typeof day === "number" && day > dim ? "" : day;
    setDay(safeDay);
    emit(year, m, safeDay);
  }

  function handleDay(e: React.ChangeEvent<HTMLSelectElement>) {
    const d = e.target.value === "" ? "" : parseInt(e.target.value);
    setDay(d);
    emit(year, month, d);
  }

  const selectClass = cn(
    "h-[42px] appearance-none rounded-lg border bg-[#0D1117] pl-3 pr-7 text-sm text-white outline-none transition-colors",
    error
      ? "border-[#ff6b6b]/50 focus:border-[#ff6b6b]/80"
      : "border-white/8 focus:border-[#368BFE]/60",
  );

  return (
    <div className="flex items-center gap-2">
      {/* Month */}
      <div className="relative flex-[2]">
        <select value={month} onChange={handleMonth} className={cn(selectClass, "w-full")}
          aria-label="Month">
          {MONTHS.map((name, idx) => (
            <option key={idx} value={idx} className="bg-[#1C2026]">{name}</option>
          ))}
        </select>
        <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white/25" aria-hidden />
      </div>

      {/* Day */}
      <div className="relative flex-1">
        <select value={day} onChange={handleDay} className={cn(selectClass, "w-full")}
          aria-label="Day">
          <option value="" className="bg-[#1C2026]">DD</option>
          {days.map((d) => (
            <option key={d} value={d} className="bg-[#1C2026]">{d}</option>
          ))}
        </select>
        <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white/25" aria-hidden />
      </div>

      {/* Year */}
      <div className="relative flex-[1.5]">
        <select value={year} onChange={handleYear} className={cn(selectClass, "w-full")}
          aria-label="Year">
          {years.map((y) => (
            <option key={y} value={y} className="bg-[#1C2026]">{y}</option>
          ))}
        </select>
        <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white/25" aria-hidden />
      </div>
    </div>
  );
}
