"use client";

import { useFormContext } from "react-hook-form";
import { type FormValues } from "@/lib/upload/schema";
import { StepWrapper, Field, FieldError, inputClass } from "./_helpers";

export function StepPublication() {
  const {
    register,
    formState: { errors },
  } = useFormContext<FormValues>();

  return (
    <StepWrapper
      title="Publication Details"
      description="Alexandria only accepts theses that have been publicly presented or published."
    >
      {/* Conference */}
      <Field
        label="Conference"
        required
        hint="The conference, symposium, or event where this thesis was presented."
      >
        <input
          {...register("conference")}
          type="text"
          placeholder="e.g. International Conference on Computer Science 2024"
          className={inputClass(!!errors.conference)}
        />
        {errors.conference && <FieldError>{errors.conference.message}</FieldError>}
      </Field>

      {/* Publication Link */}
      <Field
        label="Publication Link"
        required
        hint="A public URL to the thesis proceedings, journal, or official publication."
      >
        <input
          {...register("publication_link")}
          type="url"
          placeholder="https://…"
          className={inputClass(!!errors.publication_link)}
        />
        {errors.publication_link && (
          <FieldError>{errors.publication_link.message}</FieldError>
        )}
      </Field>
    </StepWrapper>
  );
}
