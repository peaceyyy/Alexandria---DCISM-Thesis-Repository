"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileUp,
  Flag,
  LoaderCircle,
  Maximize2,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { CommentSidePanel } from "@/components/review/comment-side-panel";
import { LessonsModal } from "@/app/upload/_components/lessons-modal";
import { DEPARTMENTS } from "@/lib/domain/departments";
import {
  parseLessonEntries,
  serializeLessonEntries,
} from "@/lib/domain/lessons";
import {
  parseResearchAreaIds,
  serializeResearchAreaIds,
  type ResearchAreaId,
} from "@/lib/domain/research-areas";
import { ResearchAreaMultiSelect } from "@/components/research/research-area-multi-select";
import { ReviewAuditTimeline } from "@/components/review/review-audit-timeline";
import { ReviewableField } from "@/components/review/reviewable-field";
import type { ReviewFieldKey } from "@/components/review/types";
import { useToast } from "@/components/ui/toast-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  resubmitFlaggedSubmission,
  saveFlaggedSubmissionCorrection,
} from "@/lib/services/review-service";
import type { ReviewSubmission, ThesisAuthorInput } from "@/lib/services/types";
import { getCorrectionSummary } from "@/lib/review/correction-state";
import styles from "./member-correction-client.module.css";

type ContributorDraft = ThesisAuthorInput & { id?: number };

type CorrectionForm = {
  title: string;
  department: string;
  studyType: "thesis" | "capstone";
  publicationDate: string;
  publicationLink: string;
  conference: string;
  researchAreaIds: ResearchAreaId[];
  abstract: string;
  recommendations: string;
  lessonsLearned: string;
  tags: string;
  contributors: ContributorDraft[];
};

function createForm(submission: ReviewSubmission): CorrectionForm {
  const fallbackContributors: ContributorDraft[] = [
    ...submission.authors.map((display_name, index) => ({
      user_id: null,
      display_name,
      contribution_role: "author" as const,
      sort_order: index,
    })),
    ...submission.advisers.map((display_name, index) => ({
      user_id: null,
      display_name,
      contribution_role: "adviser" as const,
      sort_order: index,
    })),
  ];

  return {
    title: submission.title,
    department: submission.department,
    studyType: submission.studyType,
    publicationDate: submission.publicationDate,
    publicationLink: submission.publicationLink ?? "",
    conference: submission.conference ?? "",
    researchAreaIds: parseResearchAreaIds(submission.researchArea),
    abstract: submission.abstract,
    recommendations: submission.recommendations ?? "",
    lessonsLearned: submission.lessonsLearned ?? "",
    tags: submission.tags.join(", "),
    contributors: (submission.contributorEntries ?? fallbackContributors).map(
      (entry) => ({
        id: entry.id,
        user_id: entry.user_id,
        display_name: entry.display_name,
        contribution_role: entry.contribution_role,
        sort_order: entry.sort_order ?? 0,
      }),
    ),
  };
}

function toUpdateValues(form: CorrectionForm) {
  return {
    title: form.title,
    department: form.department,
    study_type: form.studyType,
    publication_date: form.publicationDate,
    publication_link: form.publicationLink,
    conference: form.conference,
    research_area: serializeResearchAreaIds(form.researchAreaIds),
    abstract: form.abstract,
    recommendations: form.recommendations,
    lessons_learned: form.lessonsLearned,
    tags: form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    authors: form.contributors.map((contributor, index) => ({
      user_id: contributor.user_id,
      display_name: contributor.display_name,
      contribution_role: contributor.contribution_role,
      sort_order: form.contributors
        .slice(0, index)
        .filter(
          (entry) => entry.contribution_role === contributor.contribution_role,
        ).length,
    })),
  };
}

export function MemberCorrectionClient({
  initialSubmission,
}: {
  initialSubmission: ReviewSubmission;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [submission, setSubmission] = useState(initialSubmission);
  const [form, setForm] = useState(() => createForm(initialSubmission));
  const [activeCommentField, setActiveCommentField] =
    useState<ReviewFieldKey | null>(null);
  const [commentAnchorY, setCommentAnchorY] = useState(120);
  const [isSaving, setIsSaving] = useState(false);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [showResubmitConfirm, setShowResubmitConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [pendingExit, setPendingExit] = useState<"dashboard" | "history" | null>(null);
  const hasUnsavedWorkRef = useRef(false);
  const hasHistoryGuardRef = useRef(false);
  const allowExitRef = useRef(false);
  const correctedPdfInputRef = useRef<HTMLInputElement>(null);

  const hasUnsavedWork = hasUnsavedChanges || selectedPdf !== null;
  hasUnsavedWorkRef.current = hasUnsavedWork;

  const correctionSummary = useMemo(
    () => getCorrectionSummary(submission.fieldComments),
    [submission.fieldComments],
  );

  const commentsFor = useCallback(
    (fieldKey: ReviewFieldKey) =>
      submission.fieldComments.filter(
        (comment) => comment.fieldKey === fieldKey,
      ),
    [submission.fieldComments],
  );

  useEffect(() => {
    if (!notice) return;

    const timeoutId = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  useEffect(() => {
    if (!hasUnsavedWork) {
      if (hasHistoryGuardRef.current && !allowExitRef.current) {
        hasHistoryGuardRef.current = false;
        window.history.back();
      }
      return;
    }

    window.history.pushState(
      { ...window.history.state, correctionUnsavedGuard: true },
      "",
      window.location.href,
    );
    hasHistoryGuardRef.current = true;

    const handlePopState = () => {
      if (!hasUnsavedWorkRef.current) return;

      setPendingExit("history");
      setShowDiscardConfirm(true);
    };
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedWorkRef.current) return;

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("popstate", handlePopState);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("popstate", handlePopState);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedWork]);

  const requestExit = (destination: "dashboard" | "history") => {
    if (!hasUnsavedWork) {
      if (destination === "history") {
        router.back();
      } else {
        router.push("/home?mine=1");
      }
      return;
    }

    setPendingExit(destination);
    setShowDiscardConfirm(true);
  };

  const handleDiscardCancel = () => {
    if (pendingExit === "history") {
      window.history.pushState(
        { ...window.history.state, correctionUnsavedGuard: true },
        "",
        window.location.href,
      );
    }
    setShowDiscardConfirm(false);
    setPendingExit(null);
  };

  const handleDiscardConfirm = () => {
    if (!pendingExit) return;

    allowExitRef.current = true;
    hasUnsavedWorkRef.current = false;
    setHasUnsavedChanges(false);
    setSelectedPdf(null);
    setShowDiscardConfirm(false);

    if (pendingExit === "history") {
      router.back();
    } else {
      router.push("/home?mine=1");
    }
    setPendingExit(null);
  };

  const updateField = <
    Key extends Exclude<keyof CorrectionForm, "contributors">,
  >(
    key: Key,
    value: CorrectionForm[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
    hasUnsavedWorkRef.current = true;
    setHasUnsavedChanges(true);
    setNotice(null);
  };

  const updateContributor = (
    index: number,
    patch: Partial<ContributorDraft>,
  ) => {
    setForm((current) => ({
      ...current,
      contributors: current.contributors.map((contributor, contributorIndex) =>
        contributorIndex === index ? { ...contributor, ...patch } : contributor,
      ),
    }));
    hasUnsavedWorkRef.current = true;
    setHasUnsavedChanges(true);
  };

  const handleCommentIconClick = useCallback(
    (fieldKey: ReviewFieldKey, anchorY: number) => {
      setActiveCommentField((current) =>
        current === fieldKey ? null : fieldKey,
      );
      setCommentAnchorY(anchorY);
    },
    [],
  );

  const handleSave = async () => {
    const selectedPdfAtSave = selectedPdf;
    setIsSaving(true);
    setError(null);
    setNotice(null);
    setPdfError(null);

    const result = await saveFlaggedSubmissionCorrection({
      thesisId: submission.id,
      values: toUpdateValues(form),
      file: selectedPdfAtSave,
    });

    if (result.error || !result.data) {
      const errorMessage =
        result.error?.message ?? "Your correction could not be saved.";
      if (selectedPdfAtSave) {
        setPdfError(errorMessage);
      } else {
        setError(errorMessage);
      }
      showToast({
        title: "Correction not saved",
        description: errorMessage,
        tone: "error",
      });
      setIsSaving(false);
      return;
    }

    setSubmission(result.data);
    setForm(createForm(result.data));
    setHasUnsavedChanges(false);
    setSelectedPdf(null);
    setNotice(
      selectedPdfAtSave
        ? "Changes and corrected PDF saved. You can now resubmit for review."
        : "Draft saved. Feedback on the fields you updated is now marked revised.",
    );
    setIsSaving(false);
  };

  const clearSelectedPdf = () => {
    setSelectedPdf(null);
    hasUnsavedWorkRef.current = hasUnsavedChanges;
    if (correctedPdfInputRef.current) {
      correctedPdfInputRef.current.value = "";
    }
    setPdfError(null);
  };

  const handleResubmit = async () => {
    setIsResubmitting(true);
    setError(null);
    const result = await resubmitFlaggedSubmission(submission.id);

    if (result.error || !result.data) {
      const errorMessage =
        result.error?.message ??
        "Your submission could not be returned for review.";
      setError(errorMessage);
      showToast({
        title: "Submission not returned for review",
        description: errorMessage,
        tone: "error",
      });
      setIsResubmitting(false);
      return;
    }

    setIsResubmitting(false);
    router.push("/home?mine=1&resubmitted=1");
  };

  const isLocked = submission.reviewStatus !== "flagged";
  const canResubmit = !isLocked && !hasUnsavedWork;

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <Link
          href="/home?mine=1"
          className={styles.backLink}
          onClick={(event) => {
            if (!hasUnsavedWork) return;

            event.preventDefault();
            requestExit("dashboard");
          }}
        >
          <ArrowLeft size={15} aria-hidden />
          My Submissions
        </Link>

        <div className={styles.statusBlock}>
          {/* Status chip — icon + label, same vocabulary as admin ReviewStatusIndicator */}
          <div
            className={
              isLocked
                ? styles.statusChipPending
                : styles.statusChipFlagged
            }
          >
            {isLocked ? (
              <Clock size={12} aria-hidden />
            ) : (
              <Flag size={12} aria-hidden />
            )}
            {isLocked ? "Back in review queue" : "Flagged for correction"}
          </div>
          <p>
            {isLocked
              ? "Your submission is back for review. Our team will be on it and get back to you as soon as possible!"
              : "Review the moderator feedback, make any needed revisions, then save your changes before resubmitting."}
          </p>
        </div>

        <div className={styles.summary}>
          <p className={styles.eyebrow}>Feedback summary</p>
          <dl>
            <div>
              <dt>Total comments</dt>
              <dd>{correctionSummary.totalComments}</dd>
            </div>
            <div>
              <dt>Fields revised</dt>
              <dd>{correctionSummary.revisedCommentCount}</dd>
            </div>
            <div>
              <dt>Pending revisions</dt>
              <dd>{correctionSummary.pendingRevisionCommentCount}</dd>
            </div>
          </dl>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSave}
            disabled={isLocked || isSaving || isResubmitting}
          >
            {isSaving ? (
              <LoaderCircle className={styles.spinning} size={15} aria-hidden />
            ) : (
              <Save size={15} aria-hidden />
            )}
            Save changes
          </button>
          <button
            type="button"
            className={styles.resubmitButton}
            onClick={() => setShowResubmitConfirm(true)}
            disabled={!canResubmit || isSaving || isResubmitting}
          >
            <RotateCcw size={15} aria-hidden />
            Resubmit for review
          </button>
          {hasUnsavedWork && !isLocked && (
            <p className={styles.unsavedNotice}>You have unsaved changes.</p>
          )}
        </div>

        <ReviewAuditTimeline events={submission.auditEvents} />
      </aside>

      <section className={styles.document}>
        <header className={styles.documentHeader}>
          <div>
            <p className={styles.eyebrow}>Submission corrections</p>
            <h1>{submission.title}</h1>
            <p>
              All fields are available while this submission is flagged.
              Comments stay visible beside the field they concern.
            </p>
          </div>
          {isLocked && (
            <CheckCircle2
              className={styles.lockedIcon}
              size={24}
              aria-label="Submitted for review"
            />
          )}
        </header>

        {error && (
          <p className={styles.errorMessage} role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className={styles.noticeMessage} role="status">
            {notice}
          </p>
        )}

        <div className={styles.fieldGroups} aria-disabled={isLocked}>
          <Field
            fieldKey="title"
            label="Title"
            comments={commentsFor("title")}
            activeField={activeCommentField}
            onCommentIconClick={handleCommentIconClick}
          >
            <input
              value={form.title}
              onChange={(event) => updateField("title", event.target.value)}
              disabled={isLocked}
            />
          </Field>

          <div className={styles.twoColumns}>
            <Field
              fieldKey="department"
              label="Department"
              comments={commentsFor("department")}
              activeField={activeCommentField}
              onCommentIconClick={handleCommentIconClick}
            >
              <select
                value={form.department}
                onChange={(event) =>
                  updateField("department", event.target.value)
                }
                disabled={isLocked}
              >
                {DEPARTMENTS.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              fieldKey="study_type"
              label="Study type"
              comments={commentsFor("study_type")}
              activeField={activeCommentField}
              onCommentIconClick={handleCommentIconClick}
            >
              <select
                value={form.studyType}
                onChange={(event) =>
                  updateField(
                    "studyType",
                    event.target.value as CorrectionForm["studyType"],
                  )
                }
                disabled={isLocked}
              >
                <option value="thesis">Thesis</option>
                <option value="capstone">Capstone</option>
              </select>
            </Field>
          </div>

          <div className={styles.twoColumns}>
            <Field
              fieldKey="publication_date"
              label="Publication date"
              comments={commentsFor("publication_date")}
              activeField={activeCommentField}
              onCommentIconClick={handleCommentIconClick}
            >
              <input
                type="date"
                value={form.publicationDate}
                onChange={(event) =>
                  updateField("publicationDate", event.target.value)
                }
                disabled={isLocked}
              />
            </Field>
            <Field
              fieldKey="conference"
              label="Conference"
              comments={commentsFor("conference")}
              activeField={activeCommentField}
              onCommentIconClick={handleCommentIconClick}
            >
              <input
                value={form.conference}
                onChange={(event) =>
                  updateField("conference", event.target.value)
                }
                disabled={isLocked}
              />
            </Field>
          </div>

          <Field
            fieldKey="publication_link"
            label="Publication link"
            comments={commentsFor("publication_link")}
            activeField={activeCommentField}
            onCommentIconClick={handleCommentIconClick}
          >
            <input
              type="url"
              value={form.publicationLink}
              onChange={(event) =>
                updateField("publicationLink", event.target.value)
              }
              disabled={isLocked}
            />
          </Field>

          <PeopleEditor
            label="Authors"
            fieldKey="authors"
            role="author"
            comments={commentsFor("authors")}
            contributors={form.contributors}
            activeField={activeCommentField}
            disabled={isLocked}
            onCommentIconClick={handleCommentIconClick}
            onUpdate={updateContributor}
            onChange={(contributors) => {
              setForm((current) => ({ ...current, contributors }));
              hasUnsavedWorkRef.current = true;
              setHasUnsavedChanges(true);
            }}
          />
          <PeopleEditor
            label="Advisers"
            fieldKey="advisers"
            role="adviser"
            comments={commentsFor("advisers")}
            contributors={form.contributors}
            activeField={activeCommentField}
            disabled={isLocked}
            onCommentIconClick={handleCommentIconClick}
            onUpdate={updateContributor}
            onChange={(contributors) => {
              setForm((current) => ({ ...current, contributors }));
              hasUnsavedWorkRef.current = true;
              setHasUnsavedChanges(true);
            }}
          />

          <div className={styles.twoColumns}>
            <Field
              fieldKey="research_area"
              label="Research area"
              comments={commentsFor("research_area")}
              activeField={activeCommentField}
              onCommentIconClick={handleCommentIconClick}
            >
              <ResearchAreaMultiSelect
                value={form.researchAreaIds}
                onChange={(researchAreaIds) =>
                  updateField("researchAreaIds", researchAreaIds)
                }
                disabled={isLocked}
              />
            </Field>
            <Field
              fieldKey="tags"
              label="Tags"
              comments={commentsFor("tags")}
              activeField={activeCommentField}
              onCommentIconClick={handleCommentIconClick}
            >
              <input
                value={form.tags}
                onChange={(event) => updateField("tags", event.target.value)}
                disabled={isLocked}
                placeholder="Comma-separated tags"
              />
            </Field>
          </div>

          <LongTextEditor
            fieldKey="abstract"
            label="Abstract"
            comments={commentsFor("abstract")}
            activeField={activeCommentField}
            onCommentIconClick={handleCommentIconClick}
            value={form.abstract}
            disabled={isLocked}
            onChange={(value) => updateField("abstract", value)}
          />
          <LongTextEditor
            fieldKey="recommendations"
            label="Recommendations"
            comments={commentsFor("recommendations")}
            activeField={activeCommentField}
            onCommentIconClick={handleCommentIconClick}
            value={form.recommendations}
            disabled={isLocked}
            onChange={(value) => updateField("recommendations", value)}
          />
          <Field
            fieldKey="lessons_learned"
            label="Lessons learned"
            comments={commentsFor("lessons_learned")}
            activeField={activeCommentField}
            onCommentIconClick={handleCommentIconClick}
          >
            <LessonsModal
              value={parseLessonEntries(form.lessonsLearned)}
              readOnly={isLocked}
              onChange={(entries) =>
                updateField("lessonsLearned", serializeLessonEntries(entries))
              }
            />
          </Field>

          <Field
            fieldKey="pdf_general"
            label="Primary PDF"
            comments={commentsFor("pdf_general")}
            activeField={activeCommentField}
            onCommentIconClick={handleCommentIconClick}
          >
            <div className={styles.pdfSection}>
              <p>
                {submission.primaryFile?.fileName ?? "No primary PDF attached"}
              </p>
              {submission.primaryFile && (
                <a
                  href={submission.primaryFile.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.previewLink}
                >
                  Open current PDF
                </a>
              )}
              {selectedPdf ? (
                <div className={styles.selectedPdfRow}>
                  <span className={styles.selectedPdfName}>
                    <FileUp size={16} aria-hidden />
                    <span>{selectedPdf.name}</span>
                  </span>
                  <button
                    type="button"
                    className={styles.clearPdfIconButton}
                    onClick={clearSelectedPdf}
                    disabled={isSaving || isResubmitting}
                    aria-label={`Remove selected PDF: ${selectedPdf.name}`}
                    title="Remove selected PDF"
                  >
                    <X size={18} aria-hidden />
                  </button>
                </div>
              ) : (
                <label className={styles.filePicker}>
                  <FileUp size={15} aria-hidden />
                  <span>Choose corrected PDF</span>
                  <input
                    ref={correctedPdfInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(event) => {
                      setSelectedPdf(event.target.files?.[0] ?? null);
                      hasUnsavedWorkRef.current =
                        hasUnsavedChanges || Boolean(event.target.files?.[0]);
                      setPdfError(null);
                    }}
                    disabled={isLocked || isSaving || isResubmitting}
                    aria-describedby={pdfError ? "corrected-pdf-error" : undefined}
                  />
                </label>
              )}
              {pdfError && (
                <p
                  id="corrected-pdf-error"
                  className={styles.pdfErrorMessage}
                  role="alert"
                >
                  {pdfError}
                </p>
              )}
            </div>
          </Field>
        </div>
      </section>

      <CommentSidePanel
        fieldKey={activeCommentField}
        anchorY={commentAnchorY}
        comments={activeCommentField ? commentsFor(activeCommentField) : []}
        canComment={false}
        onAddComment={() => undefined}
        onClose={() => setActiveCommentField(null)}
      />

      <Dialog open={showResubmitConfirm} onOpenChange={setShowResubmitConfirm}>
        <DialogContent
          showCloseButton={false}
          className="w-[calc(100vw-2rem)] max-w-md border-[var(--color-separator)] bg-[var(--color-surface)] text-[var(--color-text)]"
        >
          <DialogHeader>
            <DialogTitle>Resubmit this thesis for review?</DialogTitle>
            <DialogDescription>
              Your saved draft will return to the review queue. You will not be
              able to edit it again unless a moderator flags it for correction.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="-mx-4 -mb-4 border-[var(--color-separator)] bg-[var(--color-surface-alt)]">
            <button
              type="button"
              onClick={() => setShowResubmitConfirm(false)}
              disabled={isResubmitting}
              className={styles.modalCancelButton}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.confirmResubmit}
              onClick={handleResubmit}
              disabled={isResubmitting}
            >
              {isResubmitting ? (
                <LoaderCircle className={styles.spinning} size={14} aria-hidden />
              ) : (
                <RotateCcw size={14} aria-hidden />
              )}
              Resubmit for review
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showDiscardConfirm}
        onOpenChange={(open) => {
          if (!open) handleDiscardCancel();
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="w-[calc(100vw-2rem)] max-w-md border-[var(--color-separator)] bg-[var(--color-surface)] text-[var(--color-text)]"
        >
          <DialogHeader>
            <DialogTitle>Discard unsaved changes?</DialogTitle>
            <DialogDescription>
              Your edits and any selected corrected PDF have not been saved.
              Leaving now will permanently discard them.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="-mx-4 -mb-4 border-[var(--color-separator)] bg-[var(--color-surface-alt)]">
            <button
              type="button"
              className={styles.modalCancelButton}
              onClick={handleDiscardCancel}
            >
              Keep editing
            </button>
            <button
              type="button"
              className={styles.confirmDiscard}
              onClick={handleDiscardConfirm}
            >
              Discard changes and leave
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  fieldKey,
  label,
  comments,
  activeField,
  onCommentIconClick,
  children,
}: {
  fieldKey: ReviewFieldKey;
  label: string;
  comments: ReviewSubmission["fieldComments"];
  activeField: ReviewFieldKey | null;
  onCommentIconClick: (fieldKey: ReviewFieldKey, anchorY: number) => void;
  children: React.ReactNode;
}) {
  return (
    <ReviewableField
      fieldKey={fieldKey}
      label={label}
      comments={comments}
      isActive={activeField === fieldKey}
      onCommentIconClick={onCommentIconClick}
    >
      <div className={styles.control}>{children}</div>
    </ReviewableField>
  );
}

function LongTextEditor({
  fieldKey,
  label,
  comments,
  activeField,
  onCommentIconClick,
  value,
  disabled,
  onChange,
}: {
  fieldKey: ReviewFieldKey;
  label: string;
  comments: ReviewSubmission["fieldComments"];
  activeField: ReviewFieldKey | null;
  onCommentIconClick: (fieldKey: ReviewFieldKey, anchorY: number) => void;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <ReviewableField
        fieldKey={fieldKey}
        label={label}
        comments={comments}
        isActive={activeField === fieldKey}
        onCommentIconClick={onCommentIconClick}
      >
        <div className={styles.longTextPreview}>
          <p>{value || "Not provided"}</p>
          <button type="button" onClick={() => setIsOpen(true)}>
            <Maximize2 size={13} aria-hidden="true" />
            {disabled ? "View full text" : "Edit full text"}
          </button>
        </div>
      </ReviewableField>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-h-[82vh] w-[calc(100vw-2rem)] max-w-5xl border-[var(--color-separator)] bg-[var(--color-surface)] text-[var(--color-text)]">
          <DialogHeader>
            <DialogTitle>{label}</DialogTitle>
          </DialogHeader>
          <textarea
            className={styles.longTextEditor}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={disabled}
            aria-label={label}
            rows={16}
          />
          <DialogFooter>
            <button
              type="button"
              className={styles.doneButton}
              onClick={() => setIsOpen(false)}
            >
              Done
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function PeopleEditor({
  label,
  fieldKey,
  role,
  comments,
  contributors,
  activeField,
  disabled,
  onCommentIconClick,
  onUpdate,
  onChange,
}: {
  label: string;
  fieldKey: Extract<ReviewFieldKey, "authors" | "advisers">;
  role: ContributorDraft["contribution_role"];
  comments: ReviewSubmission["fieldComments"];
  contributors: ContributorDraft[];
  activeField: ReviewFieldKey | null;
  disabled: boolean;
  onCommentIconClick: (fieldKey: ReviewFieldKey, anchorY: number) => void;
  onUpdate: (index: number, patch: Partial<ContributorDraft>) => void;
  onChange: (contributors: ContributorDraft[]) => void;
}) {
  const matching = contributors
    .map((contributor, index) => ({ contributor, index }))
    .filter(({ contributor }) => contributor.contribution_role === role);

  return (
    <ReviewableField
      fieldKey={fieldKey}
      label={label}
      comments={comments}
      isActive={activeField === fieldKey}
      onCommentIconClick={onCommentIconClick}
    >
      <div className={styles.peopleEditor}>
        {matching.map(({ contributor, index }) => (
          <div
            key={`${contributor.id ?? "new"}-${index}`}
            className={styles.personRow}
          >
            <input
              value={contributor.display_name}
              onChange={(event) =>
                onUpdate(index, { display_name: event.target.value })
              }
              disabled={disabled}
              aria-label={`${label} ${index + 1}`}
            />
            <button
              type="button"
              className={styles.iconButton}
              onClick={() =>
                onChange(
                  contributors.filter(
                    (_, contributorIndex) => contributorIndex !== index,
                  ),
                )
              }
              disabled={
                disabled || (role === "author" && matching.length === 1)
              }
              aria-label={`Remove ${label.slice(0, -1).toLowerCase()}`}
              title={`Remove ${label.slice(0, -1).toLowerCase()}`}
            >
              <Trash2 size={14} aria-hidden />
            </button>
          </div>
        ))}
        <button
          type="button"
          className={styles.addPersonButton}
          onClick={() =>
            onChange([
              ...contributors,
              {
                user_id: null,
                display_name: "",
                contribution_role: role,
                sort_order: contributors.length,
              },
            ])
          }
          disabled={disabled}
        >
          <Plus size={14} aria-hidden />
          Add {label.slice(0, -1)}
        </button>
      </div>
    </ReviewableField>
  );
}
