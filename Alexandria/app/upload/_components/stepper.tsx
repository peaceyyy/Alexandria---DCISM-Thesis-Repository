"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperProps {
  steps: readonly { id: number; label: string }[];
  currentStep: number;
  errorSteps?: number[];
  onStepClick?: (step: number) => void;
}

export function Stepper({ steps, currentStep, errorSteps = [], onStepClick }: StepperProps) {
  return (
    <nav aria-label="Submission progress" className="flex items-start justify-center py-6">
      {steps.map((step, index) => {
        const isCompleted = step.id < currentStep;
        const isCurrent = step.id === currentStep;
        const hasError = errorSteps.includes(step.id);

        return (
          <div key={step.id} className="flex items-start">
            {/* Node + label */}
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => onStepClick?.(step.id)}
                disabled={!onStepClick}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Step ${step.id}: ${step.label}${isCompleted ? " — completed" : ""}`}
                className={cn(
                  "relative flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-bold transition-all duration-200",
                  isCompleted && !hasError
                    ? "border-[#1752F0] bg-[#1752F0] text-white"
                    : isCurrent
                      ? "border-[#368BFE] bg-transparent text-[#368BFE]"
                      : "border-white/12 bg-transparent text-white/25",
                  hasError && "border-[#ff6b6b] bg-[#ff6b6b]/10 text-[#ff6b6b]",
                  onStepClick && (isCompleted || hasError) ? "cursor-pointer hover:opacity-75" : "cursor-default",
                )}
              >
                {isCompleted && !hasError ? (
                  <Check size={12} strokeWidth={3} />
                ) : (
                  step.id
                )}
                {/* Active ring pulse */}
                {isCurrent && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-[#368BFE]/20" />
                )}
              </button>

              {/* Label */}
              <span
                className={cn(
                  "mt-1.5 whitespace-nowrap text-[9px] font-semibold uppercase tracking-widest",
                  isCurrent
                    ? "text-[#368BFE]"
                    : isCompleted
                      ? "text-white/35"
                      : "text-white/15",
                  hasError && "text-[#ff6b6b]",
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "mx-1 mt-3.5 h-px w-8 flex-shrink-0 transition-colors duration-300 sm:w-12",
                  step.id < currentStep ? "bg-[#1752F0]/60" : "bg-white/8",
                )}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
