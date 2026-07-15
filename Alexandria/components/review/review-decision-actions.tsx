"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, Flag, RotateCcw, ShieldAlert, Pencil, Trash2 } from "lucide-react";
import type { ReviewStatus } from "@/lib/services/types";
import type { UserRole } from "@/lib/services/types";
import styles from "./review-decision-actions.module.css";

// ─── Allowed transitions (per handoff spec) ───────────────────────────────────
//
//   for_review → accepted | flagged | trashed (admin only)
//   flagged    → for_review (only by member resubmission) | trashed (admin only)
//   accepted   → for_review (moderator correction when approved by mistake)
//   trashed    → for_review (admin restore)
//
// The UI disables irrelevant actions to reflect these rules.

function canAccept(status: ReviewStatus) {
  return status === "for_review";
}
function canFlag(status: ReviewStatus) {
  return status === "for_review";
}
function canTrash(status: ReviewStatus) {
  return status !== "trashed";
}
function canSendBackToReview(status: ReviewStatus) {
  return status === "accepted";
}

type ConfirmDecision = Extract<ReviewStatus, "accepted" | "for_review" | "trashed">;

const CONFIRM_COPY: Record<
  ConfirmDecision,
  {
    title: string;
    body: string;
    actionLabel: string;
    titleId: string;
    actionClassName: string;
    icon: "approve" | "review" | "trash";
  }
> = {
  accepted: {
    title: "Approve this submission?",
    body: "This will publish the thesis to the accepted catalog and make it visible through approved-thesis surfaces.",
    actionLabel: "Approve",
    titleId: "approve-confirm-title",
    actionClassName: styles.btnConfirmAccept,
    icon: "approve",
  },
  for_review: {
    title: "Send back to review?",
    body: "This will remove the approval and return the submission to the pending review queue.",
    actionLabel: "Send Back to Review",
    titleId: "send-back-confirm-title",
    actionClassName: styles.btnConfirmReview,
    icon: "review",
  },
  trashed: {
    title: "Trash this submission?",
    body: "This will remove the submission from the active review queue. It can be reviewed again if retrieved from the trash.",
    actionLabel: "Move to Trash",
    titleId: "trash-confirm-title",
    actionClassName: styles.btnConfirmTrash,
    icon: "trash",
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface ReviewDecisionActionsProps {
  /** Current review status of the submission. */
  status: ReviewStatus;
  /** Current reviewer's role — controls which controls are visible. */
  role: UserRole;
  /** Called with the target status after the user confirms. */
  onDecision: (nextStatus: ReviewStatus) => void;
  /** Shown in a disabled state when an async action is in progress. */
  isSubmitting?: boolean;
  /** Opens the admin-only metadata correction workspace. */
  onAdminEdit?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ReviewDecisionActions({
  status,
  role,
  onDecision,
  isSubmitting = false,
  onAdminEdit,
}: ReviewDecisionActionsProps) {
  const [pendingDecision, setPendingDecision] = useState<ConfirmDecision | null>(null);

  const handleConfirmCancel = () => setPendingDecision(null);
  const handleConfirmDecision = () => {
    if (!pendingDecision) {
      return;
    }

    const nextStatus = pendingDecision;
    setPendingDecision(null);
    onDecision(nextStatus);
  };

  const confirmCopy = pendingDecision
    ? pendingDecision === "for_review" && status === "trashed"
      ? {
          ...CONFIRM_COPY.for_review,
          title: "Restore this submission to review?",
          body: "This will return the submission to the pending review queue for a fresh moderator decision.",
          actionLabel: "Restore to Review",
          titleId: "restore-confirm-title",
        }
      : CONFIRM_COPY[pendingDecision]
    : null;
  const confirmIcon = confirmCopy?.icon === "trash"
    ? <Trash2 size={13} aria-hidden style={{ marginRight: 4 }} />
    : confirmCopy?.icon === "review"
      ? <RotateCcw size={13} aria-hidden style={{ marginRight: 4 }} />
      : <CheckCircle2 size={13} aria-hidden style={{ marginRight: 4 }} />;
  const alreadyDecided = status === "trashed";

  return (
    <>
      <div className={styles.actions}>
        <p className={styles.sectionLabel}>Decision</p>

        {canSendBackToReview(status) ? (
          <div className={styles.primaryActions}>
            <p className={styles.statusNote}>
              This submission has been approved.
            </p>
            <button
              type="button"
              className={styles.btnReview}
              onClick={() => setPendingDecision("for_review")}
              disabled={isSubmitting}
              aria-label="Send submission back to review"
            >
              <RotateCcw size={14} aria-hidden />
              Send Back to Review
            </button>
            {role === "admin" && (
              <button
                type="button"
                className={styles.btnTrash}
                onClick={() => setPendingDecision("trashed")}
                disabled={isSubmitting}
                aria-label="Move submission to trash"
              >
                <Trash2 size={14} aria-hidden />
                Trash
              </button>
            )}
          </div>
        ) : alreadyDecided ? (
          <div className={styles.primaryActions}>
            <p className={styles.statusNote}>
              This submission has been trashed.
            </p>
            {role === "admin" && (
              <button
                type="button"
                className={styles.btnReview}
                onClick={() => setPendingDecision("for_review")}
                disabled={isSubmitting}
                aria-label="Restore submission to review"
              >
                <RotateCcw size={14} aria-hidden />
                Restore to Review
              </button>
            )}
          </div>
        ) : (
          <div className={styles.primaryActions}>
            {/* Accept */}
            <button
              type="button"
              className={styles.btnAccept}
              onClick={() => setPendingDecision("accepted")}
              disabled={isSubmitting || !canAccept(status)}
              aria-label="Approve this submission"
            >
              <CheckCircle2 size={15} aria-hidden />
              Approve
            </button>

            {/* Flag for member-side revision. Members return it to pending by resubmitting. */}
            <button
              type="button"
              className={styles.btnFlag}
              onClick={() => onDecision("flagged")}
              disabled={isSubmitting || !canFlag(status)}
              aria-label="Flag submission for member revision"
            >
              <Flag size={14} aria-hidden />
              Flag for Revision
            </button>

            {/* Trash — soft destructive, requires confirm */}
            {role === "admin" && (
              <button
                type="button"
                className={styles.btnTrash}
                onClick={() => setPendingDecision("trashed")}
                disabled={isSubmitting || !canTrash(status)}
                aria-label="Move submission to trash"
              >
                <Trash2 size={14} aria-hidden />
                Trash
              </button>
            )}
          </div>
        )}

        {/* ── Admin-only controls ─────────────────────────────────────────── */}
        {role === "admin" && (
          <>
            <div className={styles.adminDivider} role="separator" />
            <div className={styles.adminSection}>
              <p className={styles.adminLabel}>
                <ShieldAlert size={12} aria-hidden />
                Admin Controls
              </p>
              <button
                type="button"
                className={styles.btnAdminEdit}
                onClick={onAdminEdit}
                disabled={isSubmitting || status === "trashed" || !onAdminEdit}
                title={
                  status === "trashed"
                    ? "Restore the submission before correcting metadata"
                    : "Correct submission metadata"
                }
                aria-label="Correct submission metadata"
              >
                <Pencil size={13} aria-hidden />
                Correct Metadata
              </button>
              <p className={styles.adminNote}>
                Corrections keep the current review status and require an audit reason.
              </p>
            </div>
          </>
        )}
      </div>

      {/* ── Decision Confirmation Modal (portaled to body to escape stacking context) ── */}
      {confirmCopy &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className={styles.confirmOverlay}
            role="dialog"
            aria-modal="true"
            aria-labelledby={confirmCopy.titleId}
          >
            <div className={styles.confirmDialog}>
              <h2 id={confirmCopy.titleId} className={styles.confirmTitle}>
                {confirmCopy.title}
              </h2>
              <p className={styles.confirmBody}>
                {confirmCopy.body}
              </p>
              <div className={styles.confirmActions}>
                <button
                  type="button"
                  className={styles.btnConfirmCancel}
                  onClick={handleConfirmCancel}
                  autoFocus
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={confirmCopy.actionClassName}
                  onClick={handleConfirmDecision}
                >
                  {confirmIcon}
                  {confirmCopy.actionLabel}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
