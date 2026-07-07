"use client";

import { useEffect, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { ArrowRight, CircleAlert, FileText, CircleCheck } from "lucide-react";
import { type FormValues, FIELD_STEP_MAP, STEPS } from "@/lib/upload/schema";
import { cn } from "@/lib/utils";

interface StepReviewProps {
  onGoToStep: (step: number) => void;
  selectedFile: File | null;
  onOpenSubmit: () => void;
}

// ─── Small read-only summary row ──────────────────────────────────────────────

function SummaryRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">{label}</p>
      <p className={cn("text-sm leading-relaxed", value ? "text-white/75" : "text-white/20 italic")}>
        {value || "—"}
      </p>
    </div>
  );
}

function SummaryChips({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">{label}</p>
      {items.length === 0 ? (
        <p className="text-sm italic text-white/20">—</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/8 bg-white/4 px-2.5 py-0.5 text-xs text-white/55"
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryBullets({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">{label}</p>
      {items.length === 0 ? (
        <p className="text-sm italic text-white/20">—</p>
      ) : (
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-white/65">
              <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-[#368BFE]/40" />
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Step section wrapper ─────────────────────────────────────────────────────

function ReviewSection({
  stepId,
  stepLabel,
  hasError,
  onFix,
  children,
}: {
  stepId: number;
  stepLabel: string;
  hasError: boolean;
  onFix: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-5 space-y-4 transition-colors",
        hasError
          ? "border-[#ff6b6b]/25 bg-[#ff6b6b]/3"
          : "border-white/6 bg-[#1C2026]/50",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hasError ? (
            <CircleAlert size={14} className="text-[#ff6b6b]" aria-hidden />
          ) : (
            <CircleCheck size={14} className="text-[#59c987]" aria-hidden />
          )}
          <p
            className={cn(
              "text-[10px] font-bold uppercase tracking-widest",
              hasError ? "text-[#ff6b6b]" : "text-white/35",
            )}
          >
            Step {stepId} · {stepLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={onFix}
          className="flex items-center gap-1 text-[10px] font-medium text-white/30 transition-colors hover:text-[#368BFE]"
        >
          {hasError ? "Fix" : "Edit"}
          <ArrowRight size={11} aria-hidden />
        </button>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// ─── Main review step ─────────────────────────────────────────────────────────

export function StepReview({
  onGoToStep,
  selectedFile,
  onOpenSubmit,
}: StepReviewProps) {
  const {
    watch,
    trigger,
    formState: { errors },
  } = useFormContext<FormValues>();

  // Run full validation when the review step mounts
  useEffect(() => {
    trigger();
  }, [trigger]);

  const values = watch();

  // Determine which wizard steps have errors
  const errorSteps = useMemo(() => {
    const stepsWithErrors = new Set<number>();
    Object.entries(errors).forEach(([field]) => {
      const step = FIELD_STEP_MAP[field];
      if (step) stepsWithErrors.add(step);
    });
    if (!selectedFile) stepsWithErrors.add(6);
    return stepsWithErrors;
  }, [errors, selectedFile]);

  const hasAnyError = errorSteps.size > 0;
  const authorsList = values.authors.filter((a) => a.contribution_role === "author");
  const advisersList = values.authors.filter((a) => a.contribution_role === "adviser");

  return (
    <div className="mx-auto w-full max-w-[540px] space-y-6 px-4 pb-0 sm:px-0">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight text-white">Review & Submit</h2>
        <p className="text-sm text-white/35">
          Check everything carefully. You can click any section to edit it.
        </p>
      </div>

      {/* Error banner */}
      {hasAnyError && (
        <div className="flex items-start gap-3 rounded-xl border border-[#ff6b6b]/20 bg-[#ff6b6b]/5 px-4 py-3.5">
          <CircleAlert size={15} className="mt-0.5 flex-shrink-0 text-[#ff6b6b]" aria-hidden />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#ff6b6b]">
              {errorSteps.size} section{errorSteps.size > 1 ? "s need" : " needs"} attention
            </p>
            <p className="text-xs text-[#ff6b6b]/60">
              Sections marked in red below have missing or invalid fields. Click{" "}
              <span className="font-medium">Fix</span> to go back and correct them.
            </p>
          </div>
        </div>
      )}

      {/* Step 1 — Basics */}
      <ReviewSection
        stepId={1}
        stepLabel={STEPS[0].label}
        hasError={errorSteps.has(1)}
        onFix={() => onGoToStep(1)}
      >
        <SummaryRow label="Study Title" value={values.title} />
        <div className="grid grid-cols-2 gap-4">
          <SummaryRow label="Department" value={values.department} />
          <SummaryRow label="Type of Study" value={values.type_of_study} />
        </div>
        <SummaryRow label="Publication Date" value={values.publication_date} />
      </ReviewSection>

      {/* Step 2 — Publication */}
      <ReviewSection
        stepId={2}
        stepLabel={STEPS[1].label}
        hasError={errorSteps.has(2)}
        onFix={() => onGoToStep(2)}
      >
        <SummaryRow label="Conference" value={values.conference} />
        <SummaryRow label="Publication Link" value={values.publication_link} />
      </ReviewSection>

      {/* Step 3 — People */}
      <ReviewSection
        stepId={3}
        stepLabel={STEPS[2].label}
        hasError={errorSteps.has(3)}
        onFix={() => onGoToStep(3)}
      >
        <SummaryChips
          label="Authors"
          items={authorsList.map((a) => a.display_name).filter(Boolean)}
        />
        <SummaryChips
          label="Advisers"
          items={advisersList.map((a) => a.display_name).filter(Boolean)}
        />
      </ReviewSection>

      {/* Step 4 — Content */}
      <ReviewSection
        stepId={4}
        stepLabel={STEPS[3].label}
        hasError={errorSteps.has(4)}
        onFix={() => onGoToStep(4)}
      >
        <div className="flex flex-col gap-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
            Abstract
          </p>
          {values.abstract ? (
            <p className="line-clamp-4 text-sm leading-relaxed text-white/65">
              {values.abstract}
            </p>
          ) : (
            <p className="text-sm italic text-white/20">—</p>
          )}
        </div>
        <SummaryChips label="Research Areas" items={values.research_areas} />
        <SummaryChips
          label="Keywords"
          items={values.tags.map((t) => `#${t}`)}
        />
      </ReviewSection>

      {/* Step 5 — Insights */}
      <ReviewSection
        stepId={5}
        stepLabel={STEPS[4].label}
        hasError={errorSteps.has(5)}
        onFix={() => onGoToStep(5)}
      >
        <div className="flex flex-col gap-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
            Recommendations
          </p>
          {values.recommendations ? (
            <p className="line-clamp-4 text-sm leading-relaxed text-white/65">
              {values.recommendations}
            </p>
          ) : (
            <p className="text-sm italic text-white/20">—</p>
          )}
        </div>
        <SummaryBullets label="Lessons Learned" items={values.lessons_learned} />
      </ReviewSection>

      {/* Step 6 — Upload */}
      <ReviewSection
        stepId={6}
        stepLabel={STEPS[5].label}
        hasError={errorSteps.has(6)}
        onFix={() => onGoToStep(6)}
      >
        {selectedFile ? (
          <div className="flex items-center gap-3">
            <FileText size={15} className="text-[#59c987]" aria-hidden />
            <div>
              <p className="text-sm text-white/75">{selectedFile.name}</p>
              <p className="text-xs text-white/30">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm italic text-[#ff6b6b]/70">No PDF uploaded yet.</p>
        )}
      </ReviewSection>
    </div>
  );
}
