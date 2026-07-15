"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  ReviewSubmission,
  StudyType,
  SubmitThesisInput,
} from "@/lib/services/types";

type MetadataDraft = {
  title: string;
  abstract: string;
  department: string;
  studyType: StudyType;
  publicationDate: string;
  publicationLink: string;
  conference: string;
  researchArea: string;
  tags: string;
  recommendations: string;
  lessonsLearned: string;
  correctionReason: string;
};

function createDraft(submission: ReviewSubmission): MetadataDraft {
  return {
    title: submission.title,
    abstract: submission.abstract,
    department: submission.department,
    studyType: submission.studyType,
    publicationDate: submission.publicationDate,
    publicationLink: submission.publicationLink ?? "",
    conference: submission.conference ?? "",
    researchArea: submission.researchArea ?? "",
    tags: submission.tags.join(", "),
    recommendations: submission.recommendations ?? "",
    lessonsLearned: submission.lessonsLearned ?? "",
    correctionReason: "",
  };
}

function toValues(draft: MetadataDraft): Partial<SubmitThesisInput> {
  return {
    title: draft.title.trim(),
    abstract: draft.abstract.trim(),
    department: draft.department.trim(),
    study_type: draft.studyType,
    publication_date: draft.publicationDate,
    publication_link: draft.publicationLink.trim(),
    conference: draft.conference.trim(),
    research_area: draft.researchArea.trim(),
    tags: draft.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    recommendations: draft.recommendations.trim(),
    lessons_learned: draft.lessonsLearned.trim(),
  };
}

export function AdminMetadataEditorDialog({
  submission,
  open,
  onOpenChange,
  onSave,
}: {
  submission: ReviewSubmission;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: {
    values: Partial<SubmitThesisInput>;
    correctionReason: string;
  }) => Promise<string | null>;
}) {
  const [draft, setDraft] = useState(() => createDraft(submission));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(createDraft(submission));
      setError(null);
    }
  }, [open, submission]);

  const update = <Key extends keyof MetadataDraft>(
    key: Key,
    value: MetadataDraft[Key],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = toValues(draft);

    if (values.tags?.length === 0) {
      setError("Add at least one tag before saving.");
      return;
    }

    if (!draft.correctionReason.trim()) {
      setError("Add a correction reason for the audit trail.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    const saveError = await onSave({
      values,
      correctionReason: draft.correctionReason,
    });
    setIsSubmitting(false);

    if (saveError) {
      setError(saveError);
      return;
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] max-w-4xl overflow-y-auto border-white/10 bg-[#1a1e23] text-white">
        <DialogHeader>
          <DialogTitle>Correct Study Metadata</DialogTitle>
          <p className="text-sm leading-6 text-[#aab1bd]">
            This correction keeps the study&apos;s current review status. A reason and full before-and-after audit record are required.
          </p>
        </DialogHeader>

        <form className="grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <InputField
              label="Title"
              value={draft.title}
              onChange={(value) => update("title", value)}
              required
            />
            <InputField
              label="Department"
              value={draft.department}
              onChange={(value) => update("department", value)}
              required
            />
            <label className="grid gap-2 text-sm font-medium text-[#d8dadc]">
              Study Type
              <select
                value={draft.studyType}
                onChange={(event) => update("studyType", event.target.value as StudyType)}
                className="min-h-10 rounded-[5px] border border-white/15 bg-white/[0.035] px-3 text-sm text-white outline-none focus:outline-2 focus:outline-[#368bfe]"
              >
                <option value="thesis">Thesis</option>
                <option value="capstone">Capstone</option>
              </select>
            </label>
            <InputField
              label="Publication Date"
              value={draft.publicationDate}
              type="date"
              onChange={(value) => update("publicationDate", value)}
              required
            />
            <InputField
              label="Conference"
              value={draft.conference}
              onChange={(value) => update("conference", value)}
            />
            <InputField
              label="Research Area"
              value={draft.researchArea}
              onChange={(value) => update("researchArea", value)}
            />
          </div>

          <InputField
            label="Tags"
            value={draft.tags}
            onChange={(value) => update("tags", value)}
            hint="Separate tags with commas."
            required
          />
          <InputField
            label="Publication Link"
            value={draft.publicationLink}
            type="url"
            onChange={(value) => update("publicationLink", value)}
          />

          <TextAreaField
            label="Abstract"
            value={draft.abstract}
            onChange={(value) => update("abstract", value)}
            rows={8}
            required
          />
          <TextAreaField
            label="Recommendations"
            value={draft.recommendations}
            onChange={(value) => update("recommendations", value)}
            rows={5}
          />
          <TextAreaField
            label="Lessons Learned"
            value={draft.lessonsLearned}
            onChange={(value) => update("lessonsLearned", value)}
            rows={5}
          />
          <TextAreaField
            label="Correction Reason"
            value={draft.correctionReason}
            onChange={(value) => update("correctionReason", value)}
            rows={3}
            maxLength={500}
            hint="This appears in the activity history."
            required
          />

          {error && (
            <p className="rounded-[5px] border border-red-400/35 bg-red-400/10 px-3 py-2 text-sm text-red-200" role="alert">
              {error}
            </p>
          )}

          <DialogFooter className="-mx-0 -mb-0 border-white/10 bg-transparent px-0 pb-0">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="min-h-9 rounded-[6px] border border-white/15 bg-transparent px-3 text-sm font-semibold text-[#d8dadc] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-[6px] border border-[#368bfe] bg-[#1752f0] px-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? <LoaderCircle className="animate-spin" size={14} aria-hidden /> : <Save size={14} aria-hidden />}
              Save Correction
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  hint,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "date" | "url";
  hint?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[#d8dadc]">
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="min-h-10 rounded-[5px] border border-white/15 bg-white/[0.035] px-3 text-sm text-white outline-none focus:outline-2 focus:outline-[#368bfe]"
      />
      {hint && <span className="text-xs font-normal text-[#939aa6]">{hint}</span>}
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  rows,
  hint,
  required = false,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows: number;
  hint?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[#d8dadc]">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        required={required}
        maxLength={maxLength}
        className="w-full resize-y rounded-[5px] border border-white/15 bg-white/[0.035] px-3 py-2 text-sm leading-6 text-white outline-none focus:outline-2 focus:outline-[#368bfe]"
      />
      {hint && <span className="text-xs font-normal text-[#939aa6]">{hint}</span>}
    </label>
  );
}
