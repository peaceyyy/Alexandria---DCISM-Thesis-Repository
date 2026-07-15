"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
} from "lucide-react";
import { StatusBadge } from "@/components/admin/status-badge";
import { AdminMetadataEditorDialog } from "@/components/review/admin-metadata-editor-dialog";
import { ReviewableField } from "@/components/review/reviewable-field";
import { ReviewDecisionActions } from "@/components/review/review-decision-actions";
import { ReviewAuditTimeline } from "@/components/review/review-audit-timeline";
import { CommentSidePanel } from "@/components/review/comment-side-panel";
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// Faint rule between field groups — much more Notion-like than a solid line
function FieldGroupDivider() {
  return (
    <div
      aria-hidden
      style={{
        height: 1,
        background: "rgba(255,255,255,0.035)",
        margin: "2px 0",
      }}
    />
  );
}

// ─── Pill chip ────────────────────────────────────────────────────────────────

function Chip({ label, accent = false }: { label: string; accent?: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "3px 10px",
        borderRadius: 9,
        fontSize: 12,
        fontWeight: 500,
        background: accent
          ? "rgba(54,139,254,0.1)"
          : "rgba(255,255,255,0.05)",
        border: accent
          ? "1px solid rgba(54,139,254,0.2)"
          : "1px solid rgba(255,255,255,0.08)",
        color: accent ? "#8ec5ff" : "#d8dadc",
      }}
    >
      {label}
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
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActionPending, setIsActionPending] = useState(false);
  const [reviewPanelOpen, setReviewPanelOpen] = useState(true);
  const [activeCommentField, setActiveCommentField] = useState<ReviewFieldKey | null>(null);
  const [commentAnchorY, setCommentAnchorY] = useState(120);
  const [isAdminMetadataEditorOpen, setIsAdminMetadataEditorOpen] = useState(false);

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
          refreshResult.error?.message ?? "The updated review could not be loaded.",
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
        nextStatus === "for_review"
        && submission.reviewStatus !== "accepted"
        && !(viewerRole === "admin" && submission.reviewStatus === "trashed")
      ) {
        setActionError("Members return flagged submissions to pending by resubmitting.");
        return;
      }

      setIsActionPending(true);
      setActionError(null);

      const result = await setReviewStatus({
        thesisId: submission.id,
        nextStatus,
      });

      if (result.error || !result.data) {
        setActionError(result.error?.message ?? "The review status could not be changed.");
        setIsActionPending(false);
        return;
      }

      setSubmission(result.data);
      setIsActionPending(false);
    },
    [submission.id],
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
        return result.error?.message ?? "The submission metadata could not be corrected.";
      }

      setSubmission(result.data);
      return null;
    },
    [submission.id, submission.reviewStatus, viewerRole],
  );

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
    <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: "32px 32px 64px" }}>
      {viewerRole === "admin" && (
        <AdminMetadataEditorDialog
          submission={submission}
          open={isAdminMetadataEditorOpen}
          onOpenChange={setIsAdminMetadataEditorOpen}
          onSave={handleAdminMetadataSave}
        />
      )}

      {/* ── Two-column layout ─────────────────────────────────────────────── */}
      {actionError && (
        <div
          role="alert"
          style={{
            borderRadius: 7,
            border: "1px solid rgba(255,107,107,0.24)",
            background: "rgba(255,107,107,0.08)",
            color: "#ffb3b3",
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
            aria-label={reviewPanelOpen ? "Collapse review panel" : "Expand review panel"}
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
              background: "#1a1e23",
              color: "#5a6070",
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              fontFamily: "inherit",
              cursor: "pointer",
              transition: "color 120ms ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#ffffff";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#5a6070";
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
              background: "#1a1e23",
              transition: "max-height 280ms cubic-bezier(0.4,0,0.2,1), opacity 200ms ease",
              maxHeight: reviewPanelOpen ? "calc(100vh - 84px)" : 0,
              opacity: reviewPanelOpen ? 1 : 0,
              flex: 1,
            }}
            aria-hidden={!reviewPanelOpen}
          >
            <div style={{ padding: "24px 16px", display: "flex", flexDirection: "column", gap: 24 }}>
              <BackLink />
              
              {/* Current status */}
              <div>
                <p
                  style={{
                    margin: "0 0 8px",
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    color: "#5a6070",
                  }}
                >
                  Current Status
                </p>
                <StatusBadge status={submission.reviewStatus} />
              </div>

              <div
                style={{
                  height: 1,
                  background: "rgba(255,255,255,0.06)",
                }}
              />

              {/* Decision actions */}
              <ReviewDecisionActions
                status={submission.reviewStatus}
                role={viewerRole}
                onDecision={handleDecision}
                isSubmitting={isActionPending}
                onAdminEdit={() => setIsAdminMetadataEditorOpen(true)}
              />

              <div
                style={{
                  height: 1,
                  background: "rgba(255,255,255,0.06)",
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
                background: "#1a1e23",
                overflow: "hidden",
              }}
            >
              <BackLink collapsed />
              
              {/* Compact status dot */}
              <span
                aria-label={`Status: ${submission.reviewStatus}`}
                title={submission.reviewStatus === "for_review" ? "Pending" : submission.reviewStatus === "accepted" ? "Approved" : submission.reviewStatus === "flagged" ? "Flagged" : "Trashed"}
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background:
                    submission.reviewStatus === "for_review" ? "#f0b83b" :
                    submission.reviewStatus === "accepted"   ? "#59c987" :
                    submission.reviewStatus === "flagged"    ? "#ff6b6b" :
                    "#696969",
                  boxShadow:
                    submission.reviewStatus === "for_review" ? "0 0 6px rgba(240,184,59,0.5)" :
                    submission.reviewStatus === "accepted"   ? "0 0 6px rgba(89,201,135,0.5)" :
                    submission.reviewStatus === "flagged"    ? "0 0 6px rgba(255,107,107,0.5)" :
                    "none",
                }}
              />
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════
            RIGHT PANEL (Main Content) — scrollable field content
            ════════════════════════════════════════════════════════════════ */}
        {/* ════════════════════════════════════════════════════════════════
            LEFT PANEL — scrollable field content
            ════════════════════════════════════════════════════════════════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>

          {/* ── Submission header ───────────────────────────────────────── */}
          <div
            style={{
              borderRadius: 7,
              border: "1px solid rgba(255,255,255,0.07)",
              background: "#1a1e23",
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 8,
              }}
            >
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                    color: "#5a6070",
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
                >
                  <h1
                    style={{
                      margin: "6px 0 0",
                      fontSize: 19,
                      fontWeight: 700,
                      color: "#ffffff",
                      lineHeight: 1.35,
                    }}
                  >
                    {submission.title}
                  </h1>
                </ReviewableField>
              </div>
              <StatusBadge status={submission.reviewStatus} />
            </div>

            {/* Quick meta */}
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: "#5a6070",
                lineHeight: 1.5,
              }}
            >
              {submission.studyType === "thesis" ? "Thesis" : "Capstone"} ·{" "}
              {submission.department} · Submitted {formatDate(submission.submittedAt)}
            </p>
          </div>

          {/* ── Reviewable fields ───────────────────────────────────────── */}
          <div
            style={{
              borderRadius: 7,
              border: "1px solid rgba(255,255,255,0.07)",
              background: "#1a1e23",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
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

            <FieldGroupDivider />

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
                <p style={{ margin: 0, fontSize: 13, color: "#5a6070" }}>—</p>
              )}
            </ReviewableField>

            <FieldGroupDivider />

            {/* Metadata row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 12,
              }}
            >
              <ReviewableField
                fieldKey="department"
                label="Department"
                comments={fieldComments("department")}
                isActive={activeCommentField === "department"}
                onCommentIconClick={handleCommentIconClick}
              >
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "#ffffff" }}>
                  {submission.department}
                </p>
              </ReviewableField>

              <ReviewableField
                fieldKey="study_type"
                label="Study Type"
                comments={fieldComments("study_type")}
                isActive={activeCommentField === "study_type"}
                onCommentIconClick={handleCommentIconClick}
              >
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "#ffffff" }}>
                  {submission.studyType === "thesis" ? "Thesis" : "Capstone"}
                </p>
              </ReviewableField>

              <ReviewableField
                fieldKey="publication_date"
                label="Publication Date"
                comments={fieldComments("publication_date")}
                isActive={activeCommentField === "publication_date"}
                onCommentIconClick={handleCommentIconClick}
              >
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "#ffffff" }}>
                  {submission.publicationDate}
                </p>
              </ReviewableField>

              <ReviewableField
                fieldKey="conference"
                label="Conference"
                comments={fieldComments("conference")}
                isActive={activeCommentField === "conference"}
                onCommentIconClick={handleCommentIconClick}
              >
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "#ffffff" }}>
                  {submission.conference ?? "Not provided"}
                </p>
              </ReviewableField>
            </div>

            <FieldGroupDivider />

            {/* Research area */}
            <ReviewableField
              fieldKey="research_area"
              label="Research Area"
              comments={fieldComments("research_area")}
              isActive={activeCommentField === "research_area"}
              onCommentIconClick={handleCommentIconClick}
            >
              {submission.researchArea ? (
                <Chip label={submission.researchArea} accent />
              ) : (
                <p style={{ margin: 0, fontSize: 13, color: "#5a6070" }}>—</p>
              )}
            </ReviewableField>

            <FieldGroupDivider />

            {/* Tags */}
            <ReviewableField
              fieldKey="tags"
              label="Tags"
              comments={fieldComments("tags")}
              isActive={activeCommentField === "tags"}
              onCommentIconClick={handleCommentIconClick}
            >
              {submission.tags.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {submission.tags.map((t) => (
                    <Chip key={t} label={t} />
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: 13, color: "#5a6070" }}>—</p>
              )}
            </ReviewableField>

            <FieldGroupDivider />

            {/* Publication link */}
            <ReviewableField
              fieldKey="publication_link"
              label="Publication Link"
              comments={fieldComments("publication_link")}
              isActive={activeCommentField === "publication_link"}
              onCommentIconClick={handleCommentIconClick}
            >
              {submission.publicationLink ? (
                <a
                  href={submission.publicationLink}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    color: "#368bfe",
                    textDecoration: "none",
                    wordBreak: "break-all",
                  }}
                >
                  <ExternalLink size={12} aria-hidden />
                  {submission.publicationLink}
                </a>
              ) : (
                <p style={{ margin: 0, fontSize: 13, color: "#5a6070" }}>—</p>
              )}
            </ReviewableField>
          </div>
          {/* ── Content fields ────────────────────────────────────────────── */}
          <div
            style={{
              borderRadius: 7,
              border: "1px solid rgba(255,255,255,0.07)",
              background: "#1a1e23",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: 24,
            }}
          >
            {/* Abstract */}
          <ReviewableField
            fieldKey="abstract"
            label="Abstract"
            comments={fieldComments("abstract")}
            isActive={activeCommentField === "abstract"}
            onCommentIconClick={handleCommentIconClick}
            expandable
          >
            <p
              style={{
                margin: 0,
                fontSize: 14,
                lineHeight: 1.7,
                color: "#d8dadc",
              }}
            >
              {submission.abstract}
            </p>
            </ReviewableField>

            <FieldGroupDivider />

            {/* Recommendations */}
          <ReviewableField
            fieldKey="recommendations"
            label="Recommendations"
            comments={fieldComments("recommendations")}
            isActive={activeCommentField === "recommendations"}
            onCommentIconClick={handleCommentIconClick}
            expandable
          >
            {submission.recommendations ? (
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: "#d8dadc" }}>
                {submission.recommendations}
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: 13, color: "#5a6070" }}>
                No recommendations provided.
              </p>
            )}
            </ReviewableField>

            <FieldGroupDivider />

            {/* Lessons Learned */}
          <ReviewableField
            fieldKey="lessons_learned"
            label="Lessons Learned"
            comments={fieldComments("lessons_learned")}
            isActive={activeCommentField === "lessons_learned"}
            onCommentIconClick={handleCommentIconClick}
            expandable
          >
            {submission.lessonsLearned ? (
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: "#d8dadc" }}>
                {submission.lessonsLearned}
              </p>
            ) : (
              <p style={{ margin: 0, fontSize: 13, color: "#5a6070" }}>
                No lessons learned provided.
              </p>
            )}
            </ReviewableField>

            <FieldGroupDivider />

            {/* PDF Section */}
          {submission.primaryFile && (
            <ReviewableField
              fieldKey="pdf_general"
              label="PDF / Paper"
              comments={fieldComments("pdf_general")}
              isActive={activeCommentField === "pdf_general"}
              onCommentIconClick={handleCommentIconClick}
            >
              {/* File info row */}
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
                      background: "rgba(54,139,254,0.1)",
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
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#ffffff" }}>
                      {submission.primaryFile.fileName}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: "#5a6070" }}>
                      {submission.primaryFile.fileSize}
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
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
                      border: "1px solid rgba(54,139,254,0.3)",
                      background: "rgba(54,139,254,0.08)",
                      color: "#368bfe",
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: "none",
                      transition: "background 150ms ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.background = "rgba(54,139,254,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.background = "rgba(54,139,254,0.08)";
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
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.04)",
                      color: "#a8b0c0",
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: "none",
                      transition: "background 150ms ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.04)";
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

// ─── Back Link ────────────────────────────────────────────────────────────────

function BackLink({ collapsed }: { collapsed?: boolean }) {
  return (
    <Link
      href="/admin/dashboard?status=for_review"
      title={collapsed ? "Back to Dashboard Queue" : undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        width: collapsed ? 32 : "fit-content",
        height: 32,
        padding: collapsed ? 0 : "0 12px",
        borderRadius: 7,
        border: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.04)",
        color: "#d8dadc",
        fontSize: 13,
        fontWeight: 600,
        textDecoration: "none",
        transition: "background 150ms ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background =
          "rgba(255,255,255,0.08)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background =
          "rgba(255,255,255,0.04)";
      }}
    >
      <ArrowLeft size={14} aria-hidden />
      {!collapsed && "Back to Dashboard Queue"}
    </Link>
  );
}
