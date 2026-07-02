"use client";

import { useFormContext } from "react-hook-form";
import { type FormValues } from "@/lib/upload/schema";
import { StepWrapper } from "./_helpers";
import { PeopleBuilder } from "@/app/upload/_components/people-builder";

export function StepPeople() {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<FormValues>();

  const authors = watch("authors");

  // Build a flat error map: global index → error message
  const authorErrors: Record<number, string> = {};
  if (Array.isArray(errors.authors)) {
    errors.authors.forEach((err, i) => {
      if (err?.display_name?.message) {
        authorErrors[i] = err.display_name.message;
      }
    });
  }

  const globalAuthorsError =
    !Array.isArray(errors.authors) && errors.authors?.message
      ? errors.authors.message
      : undefined;

  return (
    <StepWrapper
      title="People"
      description="List all authors in order, then add your adviser(s)."
    >
      <PeopleBuilder
        value={authors}
        onChange={(people) =>
          setValue("authors", people, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
        errors={authorErrors}
      />

      {globalAuthorsError && (
        <p role="alert" className="text-xs text-[#ff6b6b]">
          {globalAuthorsError}
        </p>
      )}
    </StepWrapper>
  );
}
