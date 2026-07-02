"use client";

import { useFormContext } from "react-hook-form";
import { type FormValues } from "@/lib/upload/schema";
import { StepWrapper, Field } from "./_helpers";
import { ModalEditor } from "@/app/upload/_components/modal-editor";
import { ResearchAreaPopup } from "@/app/upload/_components/research-area-popup";
import { TagInput } from "@/app/upload/_components/tag-input";

export function StepContent() {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<FormValues>();

  const abstract = watch("abstract");
  const researchAreas = watch("research_areas");
  const tags = watch("tags");

  return (
    <StepWrapper
      title="Details"
      description="Describe what your thesis is about and how it can be discovered."
    >
      {/* Abstract */}
      <Field
        label="Abstract"
        required
        hint="Click the card below to open the writing editor."
      >
        <ModalEditor
          label="Abstract"
          value={abstract}
          onChange={(val) =>
            setValue("abstract", val, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          placeholder="Paste or write your thesis abstract here…"
          minLength={50}
          hint="Your abstract summarises the problem, method, and findings. Aim for 150–300 words."
          error={errors.abstract?.message}
        />
      </Field>

      {/* Research Area */}
      <Field
        label="Research Area"
        required
        hint="Select all areas that apply to your paper."
      >
        <ResearchAreaPopup
          value={researchAreas}
          onChange={(areas) =>
            setValue("research_areas", areas, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          error={
            errors.research_areas && !Array.isArray(errors.research_areas)
              ? (errors.research_areas as { message?: string }).message
              : undefined
          }
        />
      </Field>

      {/* Keywords / Tags */}
      <Field
        label="Keywords"
        required
        hint="Type a keyword and press Enter. These help people discover your thesis."
      >
        <TagInput
          value={tags}
          onChange={(t) =>
            setValue("tags", t, { shouldDirty: true, shouldValidate: true })
          }
          error={
            errors.tags && !Array.isArray(errors.tags)
              ? (errors.tags as { message?: string }).message
              : undefined
          }
        />
      </Field>
    </StepWrapper>
  );
}
