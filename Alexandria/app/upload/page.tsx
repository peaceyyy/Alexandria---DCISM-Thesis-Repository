"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { formSchema, type FormValues, STEPS, FIELD_STEP_MAP } from "@/lib/upload/schema";
import { submitThesis } from "@/lib/services/submission-service";
import { validateThesisPdf } from "@/lib/upload/file-validation";

// Layout components
import { UploadHeader } from "@/app/upload/_components/upload-header";
import { Stepper } from "@/app/upload/_components/stepper";
import { ExitWarningDialog } from "@/app/upload/_components/exit-warning-dialog";
import { SubmitConfirmDialog } from "@/app/upload/_components/submit-confirm-dialog";

// Wizard steps
import { StepStudyBasics } from "./_components/steps/step-study-basics";
import { StepPublication } from "./_components/steps/step-publication";
import { StepPeople } from "./_components/steps/step-people";
import { StepContent } from "./_components/steps/step-content";
import { StepInsights } from "./_components/steps/step-insights";
import { StepUpload } from "./_components/steps/step-upload";
import { StepReview } from "./_components/steps/step-review";
import { cn } from "@/lib/utils";

const TOTAL_STEPS = STEPS.length;

export default function UploadPage() {
  const router = useRouter();

  // ── Wizard navigation state ──────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [animKey, setAnimKey] = useState(0);

  // ── File state (outside react-hook-form) ─────────────────────────────────
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  // ── Dialog state ─────────────────────────────────────────────────────────
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // ── Submission state ─────────────────────────────────────────────────────
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Form setup ───────────────────────────────────────────────────────────
  const methods = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      abstract: "",
      department: "DCISM",
      type_of_study: "thesis",
      research_areas: [],
      authors: [
        {
          user_id: null,
          display_name: "",
          contribution_role: "author",
          sort_order: 1,
        },
      ],
      tags: [],
      publication_date: "",
      publication_link: "",
      conference: "",
      recommendations: "",
      lessons_learned: [],
    },
  });

  const { isDirty, errors } = methods.formState;

  // ── Unsaved changes — browser tab close / refresh ────────────────────────
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty || selectedFile) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, selectedFile]);

  // ── Navigation helpers ───────────────────────────────────────────────────
  const goToStep = useCallback(
    (step: number) => {
      const clamped = Math.max(1, Math.min(step, TOTAL_STEPS));
      setDirection(clamped > currentStep ? "forward" : "backward");
      setCurrentStep(clamped);
      setAnimKey((k) => k + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [currentStep],
  );

  function handleBack() {
    goToStep(currentStep - 1);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (currentStep < TOTAL_STEPS) {
      const stepFields = Object.keys(FIELD_STEP_MAP)
        .filter((k) => FIELD_STEP_MAP[k] === currentStep) as Array<keyof FormValues>;
      
      const isValid = stepFields.length > 0 ? await methods.trigger(stepFields) : true;
      
      if (currentStep === 6 && !selectedFile) {
        setFileError("Please attach a thesis PDF before continuing.");
        return;
      }

      if (isValid) {
        goToStep(currentStep + 1);
      }
    } else {
      await handleOpenSubmit();
    }
  }

  // ── Logo click → exit warning ────────────────────────────────────────────
  function handleLogoClick() {
    if (isDirty || selectedFile) {
      setShowExitWarning(true);
    } else {
      router.push("/home");
    }
  }

  // ── Dev Tool: Quick Fill ─────────────────────────────────────────────────
  function fillDummyData() {
    methods.reset({
      title: "An Analysis of Distributed Systems in Micro-Frontend Architectures",
      abstract: "This paper explores the intricacies of implementing distributed systems concepts within the context of micro-frontend architectures, focusing on performance, state synchronization, and fault tolerance across decoupled UI domains. This study provides a comprehensive overview of modern web development paradigms.",
      department: "DCISM",
      type_of_study: "thesis",
      research_areas: ["Web Development", "Algorithms"],
      authors: [
        {
          user_id: null,
          display_name: "Jane Doe",
          contribution_role: "author",
          sort_order: 1,
        },
        {
          user_id: null,
          display_name: "Dr. John Smith",
          contribution_role: "adviser",
          sort_order: 2,
        }
      ],
      tags: ["frontend", "architecture", "distributed-systems"],
      publication_date: "2026-05-15",
      publication_link: "https://example.com/thesis",
      conference: "International Conference on Web Engineering",
      recommendations: "We recommend further study into the specific impacts of network latency on state synchronization in micro-frontends.",
      lessons_learned: [
        "State synchronization across domains requires strict contracts",
        "Micro-frontends introduce significant networking overhead"
      ],
    });
    // Jump straight to the upload step
    goToStep(6);
  }

  // ── File handling ────────────────────────────────────────────────────────
  async function handleFileChange(file: File | null) {
    setFileError(null);
    if (!file) {
      setSelectedFile(null);
      return;
    }
    const validationError = await validateThesisPdf(file);
    if (validationError) {
      setFileError(validationError);
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  }

  // ── Open submit confirm (only if no errors) ──────────────────────────────
  async function handleOpenSubmit() {
    const isValid = await methods.trigger();
    if (!isValid || !selectedFile) {
      if (!selectedFile)
        setFileError("Please attach a thesis PDF before submitting.");
      return;
    }
    setShowSubmitConfirm(true);
  }

  // ── Actual submission ─────────────────────────────────────────────────────
  async function handleConfirmSubmit() {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const data = methods.getValues();

      const payload = {
        title: data.title,
        abstract: data.abstract,
        department: data.department,
        research_area: data.research_areas.join(", "),
        authors: data.authors,
        tags: data.tags,
        publication_date: data.publication_date,
        publication_link: data.publication_link,
        conference: data.conference,
        recommendations: data.recommendations,
        lessons_learned: data.lessons_learned.join("\n"),
        study_type: data.type_of_study,
      };

      const submissionPacket = new FormData();
      submissionPacket.set("payload", JSON.stringify(payload));
      submissionPacket.set("file", selectedFile!);

      const result = await submitThesis(submissionPacket);
      if (result.error) {
        throw new Error(result.error.message || "Failed to submit thesis");
      }

      // Success → redirect to home with submission banner
      router.push("/home?submitted=1");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      console.error("[upload] submission failed:", message);
      setSubmitError(message);
      // Keep the dialog open so the error is visible — do NOT close it
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Error step tracking (for stepper indicator) ──────────────────────────
  const errorSteps =
    currentStep === TOTAL_STEPS
      ? Object.keys(errors)
          .map((field) => FIELD_STEP_MAP[field] as number | undefined)
          .filter((s): s is number => s !== undefined)
          .concat(!selectedFile ? [6] : [])
      : [];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <FormProvider {...methods}>
      <form onSubmit={handleFormSubmit} className="flex min-h-screen flex-col bg-[#14181C]">
        {/* Focused-task header */}
        <UploadHeader onLogoClick={handleLogoClick} />

        {/* Step progress indicator */}
        <div className="border-b border-white/5 px-4">
          <Stepper
            steps={STEPS}
            currentStep={currentStep}
            errorSteps={errorSteps}
            onStepClick={goToStep}
          />
        </div>

        {/* Step content — animated on navigation */}
        <main className="flex-1 px-4 pt-10 pb-24">
          <div
            key={animKey}
            className={cn(
              "w-full",
              direction === "forward"
                ? "animate-in fade-in slide-in-from-right-4 duration-200"
                : "animate-in fade-in slide-in-from-left-4 duration-200",
            )}
          >
            {currentStep === 1 && <StepStudyBasics />}
            {currentStep === 2 && <StepPublication />}
            {currentStep === 3 && <StepPeople />}
            {currentStep === 4 && <StepContent />}
            {currentStep === 5 && <StepInsights />}
            {currentStep === 6 && (
              <StepUpload
                file={selectedFile}
                onChange={handleFileChange}
                error={fileError ?? undefined}
              />
            )}
            {currentStep === 7 && (
              <StepReview
                onGoToStep={goToStep}
                selectedFile={selectedFile}
                onOpenSubmit={handleOpenSubmit}
              />
            )}
          </div>
        </main>

        {/* ── Sticky footer nav bar ─────────────────────────────────────── */}
        <div className="sticky bottom-0 z-30 border-t border-white/[0.06] bg-[#14181C]/90 backdrop-blur-md">
          <div className="mx-auto flex max-w-[540px] items-center gap-4 px-4 py-4">

            {currentStep < TOTAL_STEPS ? (
              <>
                {/* Back — ghost, clearly subordinate */}
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                  className="flex h-9 items-center gap-1 rounded-md px-3 text-sm text-white/35 transition-all hover:text-white/70 disabled:pointer-events-none disabled:opacity-20"
                >
                  <ChevronLeft size={14} aria-hidden />
                  Back
                </button>

                {/* Progress track — fills the remaining space */}
                <div className="flex flex-1 flex-col items-center gap-2">
                  {/* Segmented dots */}
                  <div className="flex items-center gap-1.5" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={TOTAL_STEPS}>
                    {Array.from({ length: TOTAL_STEPS - 1 }).map((_, i) => {
                      const seg = i + 1;
                      return (
                        <div
                          key={seg}
                          className={cn(
                            "h-1 rounded-full transition-all duration-300",
                            seg < currentStep
                              ? "w-4 bg-[#1752F0]"
                              : seg === currentStep
                                ? "w-5 bg-[#368BFE]"
                                : "w-3 bg-white/10",
                          )}
                        />
                      );
                    })}
                  </div>
                  {/* Step label */}
                  <span className="text-[9px] font-semibold uppercase tracking-widest text-white/20">
                    Step {currentStep} of {TOTAL_STEPS - 1}
                  </span>
                </div>

                {/* Dev tool — muted, ghost, tucked away */}
                {process.env.NODE_ENV === "development" && (
                  <button
                    type="button"
                    onClick={fillDummyData}
                    title="Dev: Quick Fill"
                    className="flex h-7 items-center rounded border border-white/8 px-2 text-[9px] font-semibold uppercase tracking-wider text-white/20 transition-colors hover:border-white/15 hover:text-white/40"
                  >
                    Fill
                  </button>
                )}

                {/* Next — primary CTA */}
                <button
                  type="submit"
                  className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1752F0] px-5 text-sm font-semibold text-white shadow-lg shadow-[#1752F0]/20 transition-all hover:bg-[#368BFE] hover:shadow-[#368BFE]/25"
                >
                  Next
                  <ChevronRight size={14} aria-hidden />
                </button>
              </>
            ) : (
              /* ── Review step footer ─────────────────────────────────────── */
              <>
                <button
                  type="button"
                  onClick={handleLogoClick}
                  className="flex h-9 items-center rounded-md px-3 text-sm text-white/35 transition-colors hover:text-white/60"
                >
                  Back to Home
                </button>

                <div className="flex-1" />

                <button
                  type="button"
                  onClick={handleOpenSubmit}
                  className="flex h-9 items-center gap-1.5 rounded-lg bg-[#1752F0] px-5 text-sm font-semibold text-white shadow-lg shadow-[#1752F0]/20 transition-all hover:bg-[#368BFE] hover:shadow-[#368BFE]/25"
                >
                  Submit Thesis
                  <ChevronRight size={14} aria-hidden />
                </button>
              </>
            )}

          </div>
        </div>
      </form>

      {/* ── Dialogs ──────────────────────────────────────────────────────── */}
      <ExitWarningDialog
        open={showExitWarning}
        onStay={() => setShowExitWarning(false)}
        onLeave={() => router.push("/home")}
      />

      <SubmitConfirmDialog
        open={showSubmitConfirm}
        onCancel={() => { setShowSubmitConfirm(false); setSubmitError(null); }}
        onConfirm={handleConfirmSubmit}
        isSubmitting={isSubmitting}
        error={submitError}
      />
    </FormProvider>
  );
}
