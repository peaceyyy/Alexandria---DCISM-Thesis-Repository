"use client";

import { useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { FileText, UploadCloud, Sparkles, CheckCircle2, Plus, X, ArrowRight } from "lucide-react";
import { submitThesis } from "@/lib/services/submission-service";
import { validateThesisPdf } from "@/lib/upload/file-validation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const APPLICATION_TIME_ZONE = "Asia/Manila";

function getCurrentCalendarDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APPLICATION_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

const currentCalendarDate = getCurrentCalendarDate();

const authorSchema = z.object({
  user_id: z.string().nullable(),
  display_name: z.string().min(2, "Name is required"),
  contribution_role: z.string().min(1),
  sort_order: z.number().min(1),
});

const formSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  abstract: z.string().min(50, "Abstract must be at least 50 characters"),
  department: z.string().min(1),
  research_area: z.string().min(1),
  authors: z.array(authorSchema).min(1, "At least one author is required"),
  tags: z.string().min(1, "At least one tag is required"),
  publication_date: z.iso.date("Publication date is required"),
  publication_link: z.string().optional().or(z.literal("")),
  conference: z.string().optional(),
  recommendations: z.string().optional(),
  lessons_learned: z.string().optional(),
}).superRefine((data, context) => {
  if (!data.publication_date) {
    return;
  }

  if (data.publication_date > currentCalendarDate) {
    context.addIssue({
      code: "custom",
      path: ["publication_date"],
      message: "Publication date cannot be later than today",
    });
  }
});

type FormValues = z.infer<typeof formSchema>;

export function SubmissionPopupPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      abstract: "",
      department: "DCISM",
      research_area: "",
      authors: [
        {
          user_id: null,
          display_name: "",
          contribution_role: "author",
          sort_order: 1,
        },
      ],
      tags: "",
      publication_date: "",
      publication_link: "",
      conference: "",
      recommendations: "",
      lessons_learned: "",
    },
  });

  const {
    fields: authorFields,
    append: appendAuthor,
    remove: removeAuthor,
  } = useFieldArray({
    name: "authors",
    control,
  });

  const fillDummyData = () => {
    setValue("title", "Designing a Smart Review Workflow for Research Repositories");
    setValue(
      "abstract",
      "This sample submission highlights how structured moderation, metadata enrichment, and document validation improve repository quality and reviewer efficiency.",
    );
    setValue("department", "DCISM");
    setValue("research_area", "Artificial Intelligence");
    setValue("tags", "ai, review, repository");
    setValue("authors.0.display_name", "Alex Rivera");
    setValue("authors.0.contribution_role", "author");
  };

  const summaryItems = useMemo(
    () => [
      "Clear study metadata",
      "PDF validation and review",
      "Trackable moderator feedback",
    ],
    [],
  );

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (!selectedFile) {
        throw new Error("Please attach a thesis PDF before submitting.");
      }

      const fileValidationError = await validateThesisPdf(selectedFile);
      if (fileValidationError) {
        throw new Error(fileValidationError);
      }

      const payload = {
        ...data,
        tags: data.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        publication_link: data.publication_link || undefined,
        conference: data.conference || undefined,
        recommendations: data.recommendations || undefined,
        lessons_learned: data.lessons_learned || undefined,
      };

      const submissionPacket = new FormData();
      submissionPacket.set("payload", JSON.stringify(payload));
      submissionPacket.set("file", selectedFile);

      const result = await submitThesis(submissionPacket);
      if (result.error) {
        throw new Error(result.error.message || "Failed to create thesis record");
      }

      setShowSuccessDialog(true);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(54,139,254,0.22),_transparent_42%),linear-gradient(135deg,_#07111d_0%,_#0f1724_100%)] px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 rounded-[28px] border border-white/10 bg-slate-950/80 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-6 lg:p-8">
        <header className="flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/5 p-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-sky-400/40 bg-sky-400/12 px-3 py-1 text-sm text-sky-200">
              <Sparkles className="size-4" />
              Submission center
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Share your study with the Alexandria community
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
                Upload a thesis or capstone, add the key details reviewers need, and keep the process smooth from submission to moderation.
              </p>
            </div>
          </div>
          <Button type="button" variant="outline" onClick={fillDummyData} className="border-white/10 bg-white/5 text-white hover:bg-white/10">
            Use sample data
          </Button>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 rounded-[24px] border border-white/10 bg-slate-900/80 p-5 sm:p-6">
            {error ? (
              <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-sky-300" />
                <h2 className="text-lg font-semibold text-white">Study details</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-slate-200">Title</label>
                  <input
                    {...register("title")}
                    placeholder="Enter your thesis or study title"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-sky-400 focus:outline-none"
                  />
                  {errors.title ? <p className="text-sm text-rose-300">{errors.title.message}</p> : null}
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-slate-200">Abstract</label>
                  <textarea
                    {...register("abstract")}
                    rows={4}
                    placeholder="Summarize your study, methods, and significance"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-sky-400 focus:outline-none"
                  />
                  {errors.abstract ? <p className="text-sm text-rose-300">{errors.abstract.message}</p> : null}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Department</label>
                  <select
                    {...register("department")}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-sky-400 focus:outline-none"
                  >
                    <option value="DCISM" className="text-slate-900">DCISM</option>
                    <option value="CAS" className="text-slate-900">CAS</option>
                    <option value="TC" className="text-slate-900">TC</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Research area</label>
                  <input
                    {...register("research_area")}
                    placeholder="e.g. AI, Education"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-sky-400 focus:outline-none"
                  />
                  {errors.research_area ? <p className="text-sm text-rose-300">{errors.research_area.message}</p> : null}
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-slate-200">Tags</label>
                  <input
                    {...register("tags")}
                    placeholder="Comma separated values"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-sky-400 focus:outline-none"
                  />
                  {errors.tags ? <p className="text-sm text-rose-300">{errors.tags.message}</p> : null}
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-5 text-violet-300" />
                  <h2 className="text-lg font-semibold text-white">Authors & advisers</h2>
                </div>
                <Button type="button" size="sm" variant="outline" onClick={() => appendAuthor({ user_id: null, display_name: "", contribution_role: "author", sort_order: authorFields.length + 1 })} className="border-white/10 bg-white/5 text-white hover:bg-white/10">
                  <Plus className="mr-1 size-4" /> Add person
                </Button>
              </div>

              <div className="space-y-3">
                {authorFields.map((field, index) => (
                  <div key={field.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                    <div className="grid gap-4 md:grid-cols-[1.1fr_0.6fr_auto]">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-200">Name</label>
                        <input
                          {...register(`authors.${index}.display_name`)}
                          placeholder="Full name"
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-sky-400 focus:outline-none"
                        />
                        {errors.authors?.[index]?.display_name ? <p className="text-sm text-rose-300">{errors.authors[index]?.display_name?.message}</p> : null}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-200">Role</label>
                        <select
                          {...register(`authors.${index}.contribution_role`)}
                          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-sky-400 focus:outline-none"
                        >
                          <option value="author" className="text-slate-900">Author</option>
                          <option value="adviser" className="text-slate-900">Adviser</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeAuthor(index)}
                        disabled={authorFields.length === 1}
                        className="mt-7 inline-flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <input type="hidden" {...register(`authors.${index}.sort_order`)} />
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <UploadCloud className="size-5 text-emerald-300" />
                <h2 className="text-lg font-semibold text-white">Upload PDF</h2>
              </div>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-[24px] border border-dashed border-sky-400/40 bg-sky-400/10 px-4 py-8 text-center transition hover:border-sky-300 hover:bg-sky-400/15">
                <div className="rounded-full bg-slate-950/70 p-3">
                  <UploadCloud className="size-6 text-sky-200" />
                </div>
                <div>
                  <p className="font-medium text-white">Drop your PDF here or click to browse</p>
                  <p className="mt-1 text-sm text-slate-400">PDF only • up to 10 MiB</p>
                </div>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={async (event) => {
                    const file = event.currentTarget.files?.[0] ?? null;
                    if (!file) {
                      setSelectedFile(null);
                      return;
                    }

                    const validationError = await validateThesisPdf(file);
                    if (validationError) {
                      setSelectedFile(null);
                      setError(validationError);
                      event.currentTarget.value = "";
                      return;
                    }

                    setError(null);
                    setSelectedFile(file);
                  }}
                />
              </label>
              {selectedFile ? (
                <div className="flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-200">
                  <CheckCircle2 className="size-4" />
                  <span className="truncate">{selectedFile.name}</span>
                </div>
              ) : null}
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <FileText className="size-5 text-amber-300" />
                <h2 className="text-lg font-semibold text-white">Publication details</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Publication date</label>
                  <input
                    type="date"
                    max={currentCalendarDate}
                    {...register("publication_date")}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-sky-400 focus:outline-none"
                  />
                  {errors.publication_date ? <p className="text-sm text-rose-300">{errors.publication_date.message}</p> : null}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Publication link</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    {...register("publication_link")}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-sky-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Conference</label>
                  <input
                    {...register("conference")}
                    placeholder="Optional"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-sky-400 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Recommendations</label>
                  <textarea
                    {...register("recommendations")}
                    rows={3}
                    placeholder="Optional guidance or next steps"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-sky-400 focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-slate-200">Lessons learned</label>
                  <textarea
                    {...register("lessons_learned")}
                    rows={3}
                    placeholder="Capture key insights from the work"
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-sky-400 focus:outline-none"
                  />
                </div>
              </div>
            </section>

            <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
              <Button type="submit" className="bg-sky-500 text-white hover:bg-sky-400" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit thesis"}
                <ArrowRight className="ml-2 size-4" />
              </Button>
            </div>
          </form>

          <aside className="space-y-4">
            <div className="rounded-[24px] border border-white/10 bg-gradient-to-br from-slate-900 to-slate-800/80 p-5">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-400">What happens next</p>
              <div className="mt-4 space-y-3">
                {summaryItems.map((item, index) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="mt-0.5 flex size-7 items-center justify-center rounded-full bg-sky-500/15 text-sm font-semibold text-sky-200">
                      {index + 1}
                    </div>
                    <p className="text-sm text-slate-300">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="text-sm font-semibold text-white">Submission checklist</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-300" /> Confirm title and abstract</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-300" /> Attach document in PDF format</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-300" /> Add at least one author</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-md border border-white/10 bg-slate-950/95 text-slate-100">
          <DialogHeader>
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
              <CheckCircle2 className="size-6" />
            </div>
            <DialogTitle className="text-xl text-white">Submission received</DialogTitle>
            <DialogDescription className="text-sm text-slate-400">
              Your study has been submitted successfully and is now waiting for moderation review.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" onClick={() => setShowSuccessDialog(false)} className="bg-sky-500 text-white hover:bg-sky-400">
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
