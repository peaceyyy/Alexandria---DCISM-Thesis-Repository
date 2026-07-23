"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  LoaderCircle,
  Save,
} from "lucide-react";
import { DEPARTMENTS } from "@/lib/domain/departments";
import { ReviewableField } from "@/components/review/reviewable-field";
import {
  ReviewDecisionActions,
  ReviewStatusIndicator,
} from "@/components/review/review-decision-actions";
import { ReviewAuditTimeline } from "@/components/review/review-audit-timeline";
import { CommentSidePanel } from "@/components/review/comment-side-panel";
import { useToast } from "@/components/ui/toast-provider";
import { BackLink } from "@/components/ui/back-link";
import {
  getResearchAreaLabel,
  parseResearchAreaIds,
  serializeResearchAreaIds,
  type ResearchAreaId,
} from "@/lib/domain/research-areas";
import { parseLessonEntries, serializeLessonEntries } from "@/lib/domain/lessons";
import type { ReviewFieldKey } from "@/components/review/types";
import {
  addReviewComment,
  adminUpdateSubmissionMetadata,
  getReviewSubmission,
  setReviewStatus,
} from "@/lib/services/review-service";
import type {
  ReviewStatus,
  ReviewSubmission,
  SubmitThesisInput,
  UserRole,
} from "@/lib/services/types";

const DatePicker = dynamic(
  () => import("@/app/upload/_components/date-picker").then((module) => module.DatePicker),
  {
    ssr: false,
    loading: () => <DirectEditorLoading label="date picker" />,
  },
);
const LessonsModal = dynamic(
  () => import("@/app/upload/_components/lessons-modal").then((module) => module.LessonsModal),
  {
    ssr: false,
    loading: () => <DirectEditorLoading label="lessons editor" />,
  },
);
const ModalEditor = dynamic(
  () => import("@/app/upload/_components/modal-editor").then((module) => module.ModalEditor),
  {
    ssr: false,
    loading: () => <DirectEditorLoading label="text editor" />,
  },
);
const ResearchAreaMultiSelect = dynamic(
  () => import("@/components/research/research-area-multi-select").then((module) => module.ResearchAreaMultiSelect),
  {
    ssr: false,
    loading: () => <DirectEditorLoading label="research-area selector" />,
  },
);

function DirectEditorLoading({ label }: { label: string }) {
  return (
    <div className="flex min-h-[42px] items-center rounded-md border border-[var(--color-separator)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text-muted)]">
      Loading {label}…
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

type AdminMetadataDraft = {
  title: string;
  department: string;
  studyType: "thesis" | "capstone";
  publicationDate: string;
  publicationLink: string;
  conference: string;
  researchAreaIds: ResearchAreaId[];
  tags: string;
  abstract: string;
  recommendations: string;
  lessonsLearned: string;
};

function createAdminMetadataDraft(
  submission: ReviewSubmission,
): AdminMetadataDraft {
  return {
    title: submission.title,
    department: submission.department,
    studyType: submission.studyType,
    publicationDate: submission.publicationDate,
    publicationLink: submission.publicationLink ?? "",
    conference: submission.conference ?? "",
    researchAreaIds: parseResearchAreaIds(submission.researchArea),
    tags: submission.tags.join(", "),
    abstract: submission.abstract,
    recommendations: submission.recommendations ?? "",
    lessonsLearned: submission.lessonsLearned ?? "",
  };
}

function toAdminMetadataValues(draft: AdminMetadataDraft): Partial<SubmitThesisInput> {
  return {
    title: draft.title.trim(),
    department: draft.department,
    study_type: draft.studyType,
    publication_date: draft.publicationDate,
    publication_link: draft.publicationLink.trim(),
    conference: draft.conference.trim(),
    research_area: serializeResearchAreaIds(draft.researchAreaIds),
    tags: draft.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    abstract: draft.abstract.trim(),
    recommendations: draft.recommendations.trim(),
    lessons_learned: draft.lessonsLearned.trim(),
  };
}

function getDecisionToast(
  nextStatus: ReviewStatus,
  previousStatus: ReviewStatus,
) {
  switch (nextStatus) {
    case "accepted":
      return {
        title: "Submission approved.",
        description: "It is now available in the accepted catalog.",
      };
    case "flagged":
      return {
        title: "Submission flagged for revision.",
        description: "The submitter can now review feedback and make changes.",
      };
    case "trashed":
      return {
        title: "Submission moved to trash.",
        description: "It has been removed from the active review queue.",
      };
    case "for_review":
      return previousStatus === "trashed"
        ? {
            title: "Submission restored to review.",
            description: "It is back in the pending review queue.",
          }
        : {
            title: "Submission sent back to review.",
            description: "Its approval has been removed.",
          };
  }
}

// Faint rule between field groups — much more Notion-like than a solid line
function FieldGroupDivider() {
  return (
    <div
      aria-hidden
      style={{
        height: 1,
        background: "var(--color-separator)",
        margin: "2px 0",
      }}
    />
  );
}

// ─── Pill chip ────────────────────────────────────────────────────────────────

function Chip({
  label,
  variant = "default",
}: {
  label: string;
  variant?: "default" | "researchArea" | "tag";
}) {
  const isResearchArea = variant === "researchArea";
  const isTag = variant === "tag";

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: 9,
        fontSize: 12,
        fontWeight: 500,
        background: isResearchArea
          ? "var(--color-chip-cyan-bg)"
          : isTag
            ? "rgba(157, 223, 242, 0.07)"
          : "var(--color-surface-alt)",
        border: isResearchArea
          ? "1px solid rgba(54,139,254,0.2)"
          : isTag
            ? "1px solid rgba(157, 223, 242, 0.16)"
          : "1px solid rgba(255,255,255,0.08)",
        color: isResearchArea
          ? "var(--color-brand-bright)"
          : isTag
            ? "var(--color-chip-cyan-fg)"
            : "var(--color-text-muted)",
      }}
    >
      {isTag ? `#${label}` : label}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function ReviewDetailClient({
  initialSubmission,
  viewerRole,
}: {
  initialSubmission: ReviewSubmission;
  viewerRole: Extract<UserRole, "admin" | "moderator">;
}) {
  const [submission, setSubmission] = useState(initialSubmission);
  const { showToast } = useToast();
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);
  const [reviewPanelOpen, setReviewPanelOpen] = useState(true);
  const [activeCommentField, setActiveCommentField] =
    useState<ReviewFieldKey | null>(null);
  const [commentAnchorY, setCommentAnchorY] = useState(120);
  const [isAdminDirectEditing, setIsAdminDirectEditing] = useState(false);
  const [adminDraft, setAdminDraft] = useState(() =>
    createAdminMetadataDraft(initialSubmission),
  );
  const [adminCorrectionReason, setAdminCorrectionReason] = useState("");
  const [showDiscardDirectEdit, setShowDiscardDirectEdit] = useState(false);

  const handleAddComment = useCallback(
    async (fieldKey: ReviewFieldKey, comment: string) => {
      setIsActionPending(true);
      setActionError(null);

      const commentResult = await addReviewComment({
        thesisId: submission.id,
        fieldKey,
        comment,
      });

      if (commentResult.error) {
        setActionError(commentResult.error.message);
        setIsActionPending(false);
        return;
      }

      const refreshResult = await getReviewSubmission(submission.id);
      if (refreshResult.error || !refreshResult.data) {
        setActionError(
          refreshResult.error?.message ??
            "The updated review could not be loaded.",
        );
        setIsActionPending(false);
        return;
      }

      setSubmission(refreshResult.data);
      setIsActionPending(false);
    },
    [submission.id],
  );

  const handleDecision = useCallback(
    async (nextStatus: ReviewStatus) => {
      if (
        nextStatus === "flagged" &&
        !submission.fieldComments.some(
          (comment) => comment.memberRevisedAt === null,
        )
      ) {
        setActionError(
          "Add at least one review comment before flagging this submission for revision.",
        );
        return;
      }

      if (
        nextStatus === "for_review" &&
        submission.reviewStatus !== "accepted" &&
        !(viewerRole === "admin" && submission.reviewStatus === "trashed")
      ) {
        setActionError(
          "Members return flagged submissions to pending by resubmitting.",
        );
        return;
      }

      setIsActionPending(true);
      setActionError(null);

      const result = await setReviewStatus({
        thesisId: submission.id,
        nextStatus,
      });

      if (result.error || !result.data) {
        setActionError(
          result.error?.message ?? "The review status could not be changed.",
        );
        setIsActionPending(false);
        return;
      }

      setSubmission(result.data);
      showToast(getDecisionToast(nextStatus, submission.reviewStatus));
      setIsActionPending(false);
    },
    [
      showToast,
      submission.fieldComments,
      submission.id,
      submission.reviewStatus,
      viewerRole,
    ],
  );

  const handleAdminMetadataSave = useCallback(
    async ({
      values,
      correctionReason,
    }: {
      values: Partial<SubmitThesisInput>;
      correctionReason: string;
    }) => {
      setIsActionPending(true);
      setActionError(null);

      const result = await adminUpdateSubmissionMetadata({
        thesisId: submission.id,
        values,
        correctionReason,
      });

      setIsActionPending(false);

      if (result.error || !result.data) {
        return (
          result.error?.message ??
          "The submission metadata could not be corrected."
        );
      }

      setSubmission(result.data);
      showToast({
        title: "Submission metadata corrected.",
        description: "The correction was recorded without changing its review status.",
      });
      return null;
    },
    [showToast, submission.id],
  );

  const updateAdminDraft = <Key extends keyof AdminMetadataDraft>(
    key: Key,
    value: AdminMetadataDraft[Key],
  ) => {
    setAdminDraft((current) => ({ ...current, [key]: value }));
  };

  const beginAdminDirectEdit = () => {
    if (viewerRole !== "admin" || submission.reviewStatus === "trashed") return;

    setAdminDraft(createAdminMetadataDraft(submission));
    setAdminCorrectionReason("");
    setShowDiscardDirectEdit(false);
    setActionError(null);
    setIsAdminDirectEditing(true);
  };

  const hasAdminDraftChanges =
    JSON.stringify(adminDraft) !==
      JSON.stringify(createAdminMetadataDraft(submission)) ||
    adminCorrectionReason.trim().length > 0;

  const requestExitAdminDirectEdit = () => {
    if (hasAdminDraftChanges) {
      setShowDiscardDirectEdit(true);
      return;
    }

    setIsAdminDirectEditing(false);
  };

  const discardAdminDirectEdit = () => {
    setAdminDraft(createAdminMetadataDraft(submission));
    setAdminCorrectionReason("");
    setShowDiscardDirectEdit(false);
    setIsAdminDirectEditing(false);
  };

  const handleAdminDirectSave = async () => {
    const values = toAdminMetadataValues(adminDraft);

    if (!values.title?.trim() || !values.abstract?.trim()) {
      setActionError("Title and abstract are required before saving.");
      return;
    }

    if (!values.tags?.length) {
      setActionError("Add at least one tag before saving.");
      return;
    }

    if (!adminCorrectionReason.trim()) {
      setActionError("Add a correction reason for the audit trail.");
      return;
    }

    const saveError = await handleAdminMetadataSave({
      values,
      correctionReason: adminCorrectionReason,
    });

    if (saveError) {
      setActionError(saveError);
      return;
    }

    setAdminCorrectionReason("");
    setShowDiscardDirectEdit(false);
    setIsAdminDirectEditing(false);
  };

  // ── Helper: get comments for a specific field ────────────────────────────────
  const fieldComments = useCallback(
    (key: ReviewFieldKey) =>
      (submission?.fieldComments ?? []).filter((c) => c.fieldKey === key),
    [submission],
  );

  // ── Comment icon click → open floating panel at field's vertical position ───
  const handleCommentIconClick = useCallback(
    (key: ReviewFieldKey, anchorY: number) => {
      // Toggle — click same icon again to close
      if (activeCommentField === key) {
        setActiveCommentField(null);
      } else {
        setActiveCommentField(key);
        setCommentAnchorY(anchorY);
      }
    },
    [activeCommentField],
  );

  const canComment = viewerRole === "admin" || viewerRole === "moderator";

  // ─── Layout ───────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
        padding: "32px 32px 64px",
      }}
    >
      {/* ── Two-column layout ─────────────────────────────────────────────── */}
      {actionError && (
        <div
          role="alert"
          style={{
            borderRadius: 7,
            border: "1px solid rgba(255,107,107,0.24)",
            background: "var(--color-chip-red-bg)",
            color: "var(--color-chip-red-text)",
            padding: "12px 14px",
            fontSize: 13,
          }}
        >
          {actionError}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: reviewPanelOpen ? "300px 1fr" : "44px 1fr",
          gap: 24,
          alignItems: "start",
          transition: "grid-template-columns 280ms cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* ════════════════════════════════════════════════════════════════
            LEFT PANEL — sticky review controls (collapsible)
            ════════════════════════════════════════════════════════════════ */}
        <div
          style={{
            position: "sticky",
            top: 24,
            display: "flex",
            flexDirection: "column",
            gap: 0,
            maxHeight: "calc(100vh - 48px)",
          }}
        >
          {/* Collapse/Expand toggle strip */}
          <button
            type="button"
            onClick={() => setReviewPanelOpen((prev) => !prev)}
            aria-expanded={reviewPanelOpen}
            aria-controls="review-panel"
            aria-label={
              reviewPanelOpen ? "Collapse review panel" : "Expand review panel"
            }
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: reviewPanelOpen ? "space-between" : "center",
              gap: 6,
              width: "100%",
              padding: reviewPanelOpen ? "12px 16px" : "12px 0",
              borderRadius: "7px 7px 0 0",
              border: "1px solid rgba(255,255,255,0.07)",
              borderBottom: "none",
              background: "var(--color-surface-alt)",
              color: "var(--color-text-muted)",
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              fontFamily: "inherit",
              cursor: "pointer",
              transition: "color 120ms ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                e.currentTarget.style.color = "var(--color-text)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color =
                "var(--color-text-muted)";
            }}
          >
            {reviewPanelOpen && <span>Review Panel</span>}
            {reviewPanelOpen ? (
              <ChevronLeft size={14} aria-hidden />
            ) : (
              <ChevronRight size={14} aria-hidden />
            )}
          </button>

          {/* Panel body */}
          <div
            id="review-panel"
            style={{
              overflowY: "auto",
              overflowX: "hidden",
              borderRadius: "0 0 7px 7px",
              border: "1px solid rgba(255,255,255,0.07)",
              background: "var(--color-surface-alt)",
              transition:
                "max-height 280ms cubic-bezier(0.4,0,0.2,1), opacity 200ms ease",
              maxHeight: reviewPanelOpen ? "calc(100vh - 84px)" : 0,
              opacity: reviewPanelOpen ? 1 : 0,
              flex: 1,
            }}
            aria-hidden={!reviewPanelOpen}
          >
            <div
              style={{
                padding: "24px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 24,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <BackLink
                  href="/admin/dashboard?status=for_review"
                  label="Back to dashboard"
                  className="h-8 min-h-8 border border-[var(--color-separator-mid)] bg-[var(--color-surface-alt)] px-3"
                />
                <ReviewStatusIndicator status={submission.reviewStatus} />
              </div>

              {/* Decision actions */}
              <ReviewDecisionActions
                status={submission.reviewStatus}
                role={viewerRole}
                onDecision={handleDecision}
                isSubmitting={isActionPending}
                onAdminDirectEdit={
                  isAdminDirectEditing
                    ? requestExitAdminDirectEdit
                    : beginAdminDirectEdit
                }
                isAdminDirectEditing={isAdminDirectEditing}
                isMetadataEditActive={isAdminDirectEditing}
              />

              <div
                style={{
                  height: 1,
                  background: "var(--color-separator)",
                }}
              />

              {/* Audit timeline */}
              <ReviewAuditTimeline events={submission.auditEvents} />
            </div>
          </div>

          {/* Collapsed mini — shows only when panel is hidden */}
          {!reviewPanelOpen && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                padding: "12px 0",
                borderRadius: "0 0 7px 7px",
                border: "1px solid rgba(255,255,255,0.07)",
                background: "var(--color-surface-alt)",
                overflow: "hidden",
              }}
            >
              <BackLink
                href="/admin/dashboard?status=for_review"
                label="Back to dashboard"
                compact
                className="border border-[var(--color-separator-mid)] bg-[var(--color-surface-alt)]"
              />

              {/* Compact status dot */}
              <span
                aria-label={`Status: ${submission.reviewStatus}`}
                title={
                  submission.reviewStatus === "for_review"
                    ? "Pending"
                    : submission.reviewStatus === "accepted"
                      ? "Approved"
                      : submission.reviewStatus === "flagged"
                        ? "Flagged"
                        : "Trashed"
                }
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background:
                    submission.reviewStatus === "for_review"
                      ? "var(--color-pronunciation)"
                      : submission.reviewStatus === "accepted"
                        ? "var(--color-success)"
                        : submission.reviewStatus === "flagged"
                          ? "var(--color-danger)"
                          : "var(--color-separator-mid)",
                  boxShadow:
                    submission.reviewStatus === "for_review"
                      ? "none"
                      : submission.reviewStatus === "accepted"
                        ? "none"
                        : submission.reviewStatus === "flagged"
                          ? "none"
                          : "none",
                }}
              />
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            RIGHT PANEL — flat document, field order mirrors member page
            ════════════════════════════════════════════════════════════════ */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            minWidth: 0,
          }}
        >
          {/* ── Document: one flat card, field order matches member page ─── */}
          <div
            style={{
              borderRadius: 7,
              border: "1px solid var(--color-separator)",
              background: "var(--color-surface-alt)",
              padding: "30px",
            }}
          >
            {/* Header: eyebrow + title + quick meta */}
            <div
              style={{
                paddingBottom: 24,
                borderBottom: "1px solid var(--color-separator)",
                marginBottom: 20,
              }}
            >
              <p
                style={{
                  margin: "0 0 2px",
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  color: "var(--color-text-muted)",
                }}
              >
                Study Review
              </p>
              <ReviewableField
                fieldKey="title"
                label="Title"
                comments={fieldComments("title")}
                isActive={activeCommentField === "title"}
                onCommentIconClick={handleCommentIconClick}
                className="min-w-0"
              >
                {isAdminDirectEditing ? (
                  <input
                    value={adminDraft.title}
                    onChange={(event) => updateAdminDraft("title", event.target.value)}
                    aria-label="Title"
                    className="mt-1 w-full rounded-md border border-[var(--color-separator-mid)] bg-[var(--color-surface)] px-3 py-2 text-[22px] font-bold leading-[1.35] text-[var(--color-text)] outline-none transition-colors focus:border-[var(--color-brand-bright)]/60"
                  />
                ) : (
                  <h1
                    style={{
                      margin: "4px 0 8px",
                      fontSize: 22,
                      fontWeight: 700,
                      color: "var(--color-text)",
                      lineHeight: 1.35,
                    }}
                  >
                    {submission.title}
                  </h1>
                )}
              </ReviewableField>
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: "var(--color-text-muted)",
                  lineHeight: 1.5,
                }}
              >
                {(isAdminDirectEditing ? adminDraft.studyType : submission.studyType) === "thesis" ? "Thesis" : "Capstone"} ·{" "}
                {isAdminDirectEditing ? adminDraft.department : submission.department} · Submitted{" "}
                {formatDate(submission.submittedAt)}
              </p>
            </div>

            {isAdminDirectEditing && (
              <section
                aria-label="Direct metadata editing controls"
                className="mb-5 grid gap-4 rounded-md border border-[var(--color-brand-bright)]/25 bg-[var(--color-brand)]/5 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text)]">Direct edit mode</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
                      You are editing the submission in place. Saving keeps its current review status and records a before-and-after audit entry.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={requestExitAdminDirectEdit}
                      disabled={isActionPending}
                      className="min-h-10 rounded-md border border-[var(--color-separator-mid)] bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-text)] transition-colors hover:bg-[var(--color-bg)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAdminDirectSave}
                      disabled={isActionPending}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-[var(--color-brand)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-brand-bright)] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isActionPending ? <LoaderCircle className="animate-spin" size={14} aria-hidden /> : <Save size={14} aria-hidden />}
                      Save Metadata
                    </button>
                  </div>
                </div>

                <label className="grid gap-2 text-sm font-medium text-[var(--color-text)]">
                  Audit reason
                  <textarea
                    value={adminCorrectionReason}
                    onChange={(event) => setAdminCorrectionReason(event.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="Explain why this direct correction is needed. This will appear in the activity history."
                    className="w-full resize-y rounded-md border border-[var(--color-separator-mid)] bg-[var(--color-surface)] px-3 py-2 text-sm leading-6 text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--color-placeholder)] focus:border-[var(--color-brand-bright)]/60"
                  />
                </label>

                {showDiscardDirectEdit && (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--color-chip-red-bd)] bg-[var(--color-chip-red-bg)] px-3 py-2.5">
                    <p className="text-sm text-[var(--color-chip-red-text)]">Discard your unsaved metadata edits?</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowDiscardDirectEdit(false)}
                        className="rounded-md border border-[var(--color-separator-mid)] bg-[var(--color-surface)] px-3 py-1.5 text-sm font-semibold text-[var(--color-text)]"
                      >
                        Keep editing
                      </button>
                      <button
                        type="button"
                        onClick={discardAdminDirectEdit}
                        className="rounded-md border border-[var(--color-chip-red-bd)] px-3 py-1.5 text-sm font-semibold text-[var(--color-chip-red-text)]"
                      >
                        Discard changes
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Fields — flat grid matching member page order */}
            <div style={{ display: "grid", gap: 10 }}>

              {/* Row 1: Department + Study Type */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 10,
                }}
              >
                <ReviewableField
                  fieldKey="department"
                  label="Department"
                  comments={fieldComments("department")}
                  isActive={activeCommentField === "department"}
                  onCommentIconClick={handleCommentIconClick}
                >
                  {isAdminDirectEditing ? (
                    <select
                      value={adminDraft.department}
                      onChange={(event) => updateAdminDraft("department", event.target.value)}
                      className="min-h-[42px] w-full rounded-md border border-[var(--color-separator-mid)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-brand-bright)]/60"
                    >
                      {DEPARTMENTS.map((department) => <option key={department} value={department}>{department}</option>)}
                    </select>
                  ) : (
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "var(--color-text)" }}>{submission.department}</p>
                  )}
                </ReviewableField>

                <ReviewableField
                  fieldKey="study_type"
                  label="Study Type"
                  comments={fieldComments("study_type")}
                  isActive={activeCommentField === "study_type"}
                  onCommentIconClick={handleCommentIconClick}
                >
                  {isAdminDirectEditing ? (
                    <select
                      value={adminDraft.studyType}
                      onChange={(event) => updateAdminDraft("studyType", event.target.value as AdminMetadataDraft["studyType"])}
                      className="min-h-[42px] w-full rounded-md border border-[var(--color-separator-mid)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-brand-bright)]/60"
                    >
                      <option value="thesis">Thesis</option>
                      <option value="capstone">Capstone</option>
                    </select>
                  ) : (
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "var(--color-text)" }}>{submission.studyType === "thesis" ? "Thesis" : "Capstone"}</p>
                  )}
                </ReviewableField>
              </div>

              {/* Row 2: Publication Date + Conference */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 10,
                }}
              >
                <ReviewableField
                  fieldKey="publication_date"
                  label="Publication Date"
                  comments={fieldComments("publication_date")}
                  isActive={activeCommentField === "publication_date"}
                  onCommentIconClick={handleCommentIconClick}
                >
                  {isAdminDirectEditing ? (
                    <DatePicker
                      value={adminDraft.publicationDate}
                      onChange={(value) => updateAdminDraft("publicationDate", value)}
                    />
                  ) : (
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "var(--color-text)" }}>{submission.publicationDate}</p>
                  )}
                </ReviewableField>

                <ReviewableField
                  fieldKey="conference"
                  label="Conference"
                  comments={fieldComments("conference")}
                  isActive={activeCommentField === "conference"}
                  onCommentIconClick={handleCommentIconClick}
                >
                  {isAdminDirectEditing ? (
                    <input
                      value={adminDraft.conference}
                      onChange={(event) => updateAdminDraft("conference", event.target.value)}
                      className="min-h-[42px] w-full rounded-md border border-[var(--color-separator-mid)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-brand-bright)]/60"
                    />
                  ) : (
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "var(--color-text)" }}>{submission.conference ?? "Not provided"}</p>
                  )}
                </ReviewableField>
              </div>

              {/* Publication link */}
              <ReviewableField
                fieldKey="publication_link"
                label="Publication Link"
                comments={fieldComments("publication_link")}
                isActive={activeCommentField === "publication_link"}
                onCommentIconClick={handleCommentIconClick}
              >
                {isAdminDirectEditing ? (
                  <input
                    type="url"
                    value={adminDraft.publicationLink}
                    onChange={(event) => updateAdminDraft("publicationLink", event.target.value)}
                    placeholder="https://"
                    className="min-h-[42px] w-full rounded-md border border-[var(--color-separator-mid)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-placeholder)] focus:border-[var(--color-brand-bright)]/60"
                  />
                ) : submission.publicationLink ? (
                  <a
                    href={submission.publicationLink}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 13,
                      color: "var(--color-brand-bright)",
                      textDecoration: "none",
                      wordBreak: "break-all",
                    }}
                  >
                    <ExternalLink size={12} aria-hidden />
                    {submission.publicationLink}
                  </a>
                ) : (
                  <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>—</p>
                )}
              </ReviewableField>

              {/* Authors */}
              <ReviewableField
                fieldKey="authors"
                label="Authors"
                comments={fieldComments("authors")}
                isActive={activeCommentField === "authors"}
                onCommentIconClick={handleCommentIconClick}
              >
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {submission.authors.map((a) => (
                    <Chip key={a} label={a} />
                  ))}
                </div>
              </ReviewableField>

              {/* Advisers */}
              <ReviewableField
                fieldKey="advisers"
                label="Advisers"
                comments={fieldComments("advisers")}
                isActive={activeCommentField === "advisers"}
                onCommentIconClick={handleCommentIconClick}
              >
                {submission.advisers.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {submission.advisers.map((a) => (
                      <Chip key={a} label={a} />
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>—</p>
                )}
              </ReviewableField>

              {/* Row 3: Research Area + Tags */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 10,
                }}
              >
                <ReviewableField
                  fieldKey="research_area"
                  label="Research Area"
                  comments={fieldComments("research_area")}
                  isActive={activeCommentField === "research_area"}
                  onCommentIconClick={handleCommentIconClick}
              >
                  {isAdminDirectEditing ? (
                    <ResearchAreaMultiSelect
                      value={adminDraft.researchAreaIds}
                      onChange={(value) => updateAdminDraft("researchAreaIds", value)}
                    />
                  ) : parseResearchAreaIds(submission.researchArea).length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {parseResearchAreaIds(submission.researchArea).map((area) => (
                        <Chip
                          key={area}
                          label={getResearchAreaLabel(area)}
                          variant="researchArea"
                        />
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>—</p>
                  )}
                </ReviewableField>

                <ReviewableField
                  fieldKey="tags"
                  label="Tags"
                  comments={fieldComments("tags")}
                  isActive={activeCommentField === "tags"}
                  onCommentIconClick={handleCommentIconClick}
              >
                  {isAdminDirectEditing ? (
                    <input
                      value={adminDraft.tags}
                      onChange={(event) => updateAdminDraft("tags", event.target.value)}
                      placeholder="Comma-separated tags"
                      className="min-h-[42px] w-full rounded-md border border-[var(--color-separator-mid)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-placeholder)] focus:border-[var(--color-brand-bright)]/60"
                    />
                  ) : submission.tags.length > 0 ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {submission.tags.map((tag) => (
                        <Chip key={tag} label={tag} variant="tag" />
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>—</p>
                  )}
                </ReviewableField>
              </div>

              <FieldGroupDivider />

              {/* Abstract */}
              <ReviewableField
                fieldKey="abstract"
                label="Abstract"
                comments={fieldComments("abstract")}
                isActive={activeCommentField === "abstract"}
                onCommentIconClick={handleCommentIconClick}
                expandable={!isAdminDirectEditing}
              >
                {isAdminDirectEditing ? (
                  <ModalEditor
                    label="Abstract"
                    value={adminDraft.abstract}
                    onChange={(value) => updateAdminDraft("abstract", value)}
                    placeholder="Write the study abstract..."
                  />
                ) : (
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: "var(--color-text-muted)" }}>
                    {submission.abstract}
                  </p>
                )}
              </ReviewableField>

              {/* Recommendations */}
              <ReviewableField
                fieldKey="recommendations"
                label="Recommendations"
                comments={fieldComments("recommendations")}
                isActive={activeCommentField === "recommendations"}
                onCommentIconClick={handleCommentIconClick}
                expandable={!isAdminDirectEditing}
              >
                {isAdminDirectEditing ? (
                  <ModalEditor
                    label="Recommendations"
                    value={adminDraft.recommendations}
                    onChange={(value) => updateAdminDraft("recommendations", value)}
                    placeholder="Write recommendations for future researchers..."
                  />
                ) : submission.recommendations ? (
                  <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: "var(--color-text-muted)" }}>
                    {submission.recommendations}
                  </p>
                ) : (
                  <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>
                    No recommendations provided.
                  </p>
                )}
              </ReviewableField>

              {/* Lessons Learned */}
              <ReviewableField
                fieldKey="lessons_learned"
                label="Lessons Learned"
                comments={fieldComments("lessons_learned")}
                isActive={activeCommentField === "lessons_learned"}
                onCommentIconClick={handleCommentIconClick}
                expandable={!isAdminDirectEditing}
              >
                {isAdminDirectEditing ? (
                  <LessonsModal
                    value={parseLessonEntries(adminDraft.lessonsLearned)}
                    onChange={(entries) =>
                      updateAdminDraft("lessonsLearned", serializeLessonEntries(entries))
                    }
                  />
                ) : submission.lessonsLearned ? (
                  <ol
                    style={{
                      margin: 0,
                      paddingLeft: 20,
                      display: "grid",
                      gap: 8,
                      fontSize: 14,
                      lineHeight: 1.7,
                      color: "var(--color-text-muted)",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {parseLessonEntries(submission.lessonsLearned).map(
                      (lesson, index) => <li key={index}>{lesson}</li>,
                    )}
                  </ol>
                ) : (
                  <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>
                    No lessons learned provided.
                  </p>
                )}
              </ReviewableField>

              {/* PDF Section */}
              {submission.primaryFile && (
                <ReviewableField
                  fieldKey="pdf_general"
                  label="PDF / Paper"
                  comments={fieldComments("pdf_general")}
                  isActive={activeCommentField === "pdf_general"}
                  onCommentIconClick={handleCommentIconClick}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 7,
                          background: "var(--color-chip-cyan-bg)",
                          border: "1px solid rgba(54,139,254,0.15)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <FileText size={16} color="#368bfe" aria-hidden />
                      </span>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--color-text)" }}>
                          {submission.primaryFile.fileName}
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: "var(--color-text-muted)" }}>
                          {submission.primaryFile.fileSize}
                        </p>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <a
                        href={submission.primaryFile.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 12px",
                          borderRadius: 6,
                          border: "1px solid var(--color-chip-cyan-bd)",
                          background: "var(--color-chip-cyan-bg)",
                          color: "var(--color-brand-bright)",
                          fontSize: 12,
                          fontWeight: 600,
                          textDecoration: "none",
                          transition: "background 150ms ease",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLAnchorElement).style.background = "var(--color-brand-cyan)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLAnchorElement).style.background = "var(--color-chip-cyan-bg)";
                        }}
                      >
                        <ExternalLink size={12} aria-hidden />
                        Open PDF
                      </a>
                      <a
                        href={submission.primaryFile.pdfUrl}
                        download={submission.primaryFile.fileName}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 12px",
                          borderRadius: 6,
                          border: "1px solid var(--color-separator-mid)",
                          background: "var(--color-surface-alt)",
                          color: "var(--color-text-muted)",
                          fontSize: 12,
                          fontWeight: 600,
                          textDecoration: "none",
                          transition: "background 150ms ease",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLAnchorElement).style.background = "var(--color-separator)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLAnchorElement).style.background = "var(--color-surface-alt)";
                        }}
                      >
                        <Download size={12} aria-hidden />
                        Download
                      </a>
                    </div>
                  </div>
                </ReviewableField>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Floating Comment Panel ───────────────────────────────────────── */}
      <CommentSidePanel
        fieldKey={activeCommentField}
        anchorY={commentAnchorY}
        comments={submission.fieldComments}
        canComment={canComment && !isActionPending}
        onAddComment={handleAddComment}
        onClose={() => setActiveCommentField(null)}
      />
    </div>
  );
}
