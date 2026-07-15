"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  FileUp,
  LoaderCircle,
  Maximize2,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { CommentSidePanel } from "@/components/review/comment-side-panel";
import { ReviewAuditTimeline } from "@/components/review/review-audit-timeline";
import { ReviewableField } from "@/components/review/reviewable-field";
import type { ReviewFieldKey } from "@/components/review/types";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  markReviewCommentAddressed,
  replaceFlaggedSubmissionPdf,
  resubmitFlaggedSubmission,
  updateFlaggedSubmission,
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
  researchArea: string;
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
    researchArea: submission.researchArea ?? "",
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
    research_area: form.researchArea,
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
  const [submission, setSubmission] = useState(initialSubmission);
  const [form, setForm] = useState(() => createForm(initialSubmission));
  const [activeCommentField, setActiveCommentField] =
    useState<ReviewFieldKey | null>(null);
  const [commentAnchorY, setCommentAnchorY] = useState(120);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [isResubmitting, setIsResubmitting] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showResubmitConfirm, setShowResubmitConfirm] = useState(false);

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

  const updateField = <
    Key extends Exclude<keyof CorrectionForm, "contributors">,
  >(
    key: Key,
    value: CorrectionForm[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
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
    setIsSaving(true);
    setError(null);
    setNotice(null);

    const result = await updateFlaggedSubmission({
      thesisId: submission.id,
      values: toUpdateValues(form),
    });

    if (result.error || !result.data) {
      setError(result.error?.message ?? "Your correction could not be saved.");
      setIsSaving(false);
      return;
    }

    setSubmission(result.data);
    setForm(createForm(result.data));
    setHasUnsavedChanges(false);
    setNotice(
      "Changes saved. Comments on revised fields can now be marked addressed.",
    );
    setIsSaving(false);
  };

  const handlePdfUpload = async () => {
    if (!selectedPdf) {
      setError("Choose a corrected PDF before attaching it.");
      return;
    }

    setIsUploadingPdf(true);
    setError(null);
    setNotice(null);
    const result = await replaceFlaggedSubmissionPdf({
      thesisId: submission.id,
      file: selectedPdf,
    });

    if (result.error || !result.data) {
      setError(
        result.error?.message ?? "The corrected PDF could not be attached.",
      );
      setIsUploadingPdf(false);
      return;
    }

    setSubmission(result.data);
    setSelectedPdf(null);
    setNotice(
      "Corrected PDF attached. PDF feedback now shows the revision evidence.",
    );
    setIsUploadingPdf(false);
  };

  const handleMarkAddressed = async (commentId: number) => {
    setIsAcknowledging(true);
    setError(null);
    setNotice(null);
    const result = await markReviewCommentAddressed({
      thesisId: submission.id,
      commentId,
    });

    if (result.error) {
      setError(result.error.message);
      setIsAcknowledging(false);
      return;
    }

    setSubmission((current) => ({
      ...current,
      fieldComments: current.fieldComments.map((comment) =>
        comment.id === commentId && result.data ? result.data : comment,
      ),
    }));
    setNotice("Comment marked addressed.");
    setIsAcknowledging(false);
  };

  const handleResubmit = async () => {
    setIsResubmitting(true);
    setError(null);
    const result = await resubmitFlaggedSubmission(submission.id);

    if (result.error || !result.data) {
      setError(
        result.error?.message ??
          "Your submission could not be returned for review.",
      );
      setIsResubmitting(false);
      return;
    }

    setIsResubmitting(false);
    router.push("/home?mine=1&resubmitted=1");
  };

  const isLocked = submission.reviewStatus !== "flagged";

  return (
    <div className={styles.page}>
      <aside className={styles.sidebar}>
        <Link href="/home?mine=1" className={styles.backLink}>
          <ArrowLeft size={15} aria-hidden />
          My Submissions
        </Link>

        <div className={styles.statusBlock}>
          <p className={styles.eyebrow}>Correction status</p>
          <strong
            className={isLocked ? styles.pendingStatus : styles.flaggedStatus}
          >
            {isLocked ? "Pending review" : "Flagged for correction"}
          </strong>
          <p>
            {isLocked
              ? "Your submission is back for review. Our team will be on it and get back to you as soon as possible!"
              : "Save edits, acknowledge feedback you addressed, then resubmit when ready."}
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
              <dt>Marked addressed</dt>
              <dd>{correctionSummary.acknowledgedCommentCount}</dd>
            </div>
            <div>
              <dt>Not yet marked</dt>
              <dd>{correctionSummary.unacknowledgedCommentCount}</dd>
            </div>
          </dl>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSave}
            disabled={isLocked || isSaving || isUploadingPdf || isResubmitting}
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
            disabled={isLocked || isSaving || isUploadingPdf || isResubmitting}
          >
            <RotateCcw size={15} aria-hidden />
            Resubmit for review
          </button>
          {hasUnsavedChanges && !isLocked && (
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
              <input
                value={form.department}
                onChange={(event) =>
                  updateField("department", event.target.value)
                }
                disabled={isLocked}
              />
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
              <input
                value={form.researchArea}
                onChange={(event) =>
                  updateField("researchArea", event.target.value)
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
          <LongTextEditor
            fieldKey="lessons_learned"
            label="Lessons learned"
            comments={commentsFor("lessons_learned")}
            activeField={activeCommentField}
            onCommentIconClick={handleCommentIconClick}
            value={form.lessonsLearned}
            disabled={isLocked}
            onChange={(value) => updateField("lessonsLearned", value)}
          />

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
              <label className={styles.filePicker}>
                <FileUp size={15} aria-hidden />
                <span>{selectedPdf?.name ?? "Choose corrected PDF"}</span>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) =>
                    setSelectedPdf(event.target.files?.[0] ?? null)
                  }
                  disabled={isLocked || isUploadingPdf}
                />
              </label>
              <button
                type="button"
                className={styles.attachButton}
                onClick={handlePdfUpload}
                disabled={isLocked || !selectedPdf || isUploadingPdf}
              >
                {isUploadingPdf ? (
                  <LoaderCircle
                    className={styles.spinning}
                    size={14}
                    aria-hidden
                  />
                ) : (
                  <FileUp size={14} aria-hidden />
                )}
                Attach corrected PDF
              </button>
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
        onMarkAddressed={isLocked ? undefined : handleMarkAddressed}
        isMarkingAddressed={isAcknowledging}
        onClose={() => setActiveCommentField(null)}
      />

      {showResubmitConfirm && (
        <div className={styles.modalOverlay} role="presentation">
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="resubmit-title"
          >
            <h2 id="resubmit-title">Resubmit this thesis for review?</h2>
            <p>
              After resubmitting, you cannot edit or resolve comments until a
              moderator flags this study again.
            </p>
            {correctionSummary.unacknowledgedCommentCount > 0 && (
              <p className={styles.modalWarning}>
                {correctionSummary.unacknowledgedCommentCount} comment
                {correctionSummary.unacknowledgedCommentCount === 1
                  ? " remains"
                  : "s remain"}{" "}
                unacknowledged. You can still resubmit.
              </p>
            )}
            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => setShowResubmitConfirm(false)}
                disabled={isResubmitting}
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
                  <LoaderCircle
                    className={styles.spinning}
                    size={14}
                    aria-hidden
                  />
                ) : (
                  <RotateCcw size={14} aria-hidden />
                )}
                Resubmit for review
              </button>
            </div>
          </div>
        </div>
      )}
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
        <DialogContent className="max-h-[82vh] max-w-3xl border-white/10 bg-[#1a1e23] text-white">
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
