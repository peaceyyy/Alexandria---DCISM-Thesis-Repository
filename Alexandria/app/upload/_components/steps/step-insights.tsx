"use client";

import { useFormContext } from "react-hook-form";
import { type FormValues } from "@/lib/upload/schema";
import { StepWrapper, Field } from "./_helpers";
import { ModalEditor } from "@/app/upload/_components/modal-editor";
import { LessonsModal } from "@/app/upload/_components/lessons-modal";

export function StepInsights() {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<FormValues>();

  const recommendations = watch("recommendations");
  const lessonsLearned = watch("lessons_learned");

  return (
    <StepWrapper
      title="Insights"
      description="Share what future researchers and teams can learn from your work."
    >
      {/* Recommendations */}
      <Field
        label="Recommendations"
        required
        hint="Click the card to open the editor. Describe future research directions, limitations, and suggested improvements."
      >
        <ModalEditor
          label="Recommendations"
          value={recommendations}
          onChange={(val) =>
            setValue("recommendations", val, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          placeholder="Write your recommendations here. Consider: what future work can be done? What are the limitations of this study? What would you improve?"
          minLength={10}
          hint="Describe gaps in the research, suggested future directions, and study limitations. Most people copy-paste this from their paper."
          error={errors.recommendations?.message}
        />
      </Field>

      {/* Lessons Learned */}
      <Field
        label="Lessons Learned"
        required
        hint="Click the card to add individual lessons. Each entry should be one concise, actionable insight."
      >
        <LessonsModal
          value={lessonsLearned}
          onChange={(lessons) =>
            setValue("lessons_learned", lessons, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          error={
            errors.lessons_learned && !Array.isArray(errors.lessons_learned)
              ? (errors.lessons_learned as { message?: string }).message
              : undefined
          }
        />
      </Field>
    </StepWrapper>
  );
}
