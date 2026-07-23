"use client";

import { useState } from "react";
import { CheckCircle2, Flag, RotateCcw, ShieldAlert, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, type ConfirmDialogIntent } from "@/components/ui/confirm-dialog";
import type { ReviewStatus } from "@/lib/services/types";
import type { UserRole } from "@/lib/services/types";
import { WorkflowStatus } from "@/components/ui/workflow-status";
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
type ConfirmDecision = Extract<
  ReviewStatus,
  "accepted" | "flagged" | "for_review" | "trashed"
>;

const CONFIRM_COPY: Record<
  ConfirmDecision,
  {
    title: string;
    body: string;
    actionLabel: string;
    confirmIntent: ConfirmDialogIntent;
    icon: "approve" | "flag" | "review" | "trash";
  }
> = {
  accepted: {
    title: "Approve this submission?",
    body: "This will publish the thesis to the accepted catalog and make it visible through approved-thesis surfaces.",
    actionLabel: "Approve",
    confirmIntent: "default",
    icon: "approve",
  },
  flagged: {
    title: "Flag this submission for revision?",
    body: "The member will be asked to review the feedback, save any needed changes, and resubmit the study for another review.",
    actionLabel: "Flag for Revision",
    confirmIntent: "outline",
    icon: "flag",
  },
  for_review: {
    title: "Send back to review?",
    body: "This will remove the approval and return the submission to the pending review queue.",
    actionLabel: "Send Back to Review",
    confirmIntent: "secondary",
    icon: "review",
  },
  trashed: {
    title: "Trash this submission?",
    body: "This will remove the submission from active queues and public browsing. Only an administrator can restore it later.",
    actionLabel: "Continue",
    confirmIntent: "destructive",
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
  /** Toggles the administrator-only in-place metadata editor. */
  onAdminDirectEdit?: () => void;
  /** Whether the in-place metadata editor is currently active. */
  isAdminDirectEditing?: boolean;
  /** Prevents review-status changes while an in-place metadata draft is open. */
  isMetadataEditActive?: boolean;
}

export function ReviewStatusIndicator({ status }: { status: ReviewStatus }) {
  return <WorkflowStatus status={status} size="compact" />;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ReviewDecisionActions({
  status,
  role,
  onDecision,
  isSubmitting = false,
  onAdminDirectEdit,
  isAdminDirectEditing = false,
  isMetadataEditActive = false,
}: ReviewDecisionActionsProps) {
  const [pendingDecision, setPendingDecision] = useState<ConfirmDecision | null>(null);
  const [trashConfirmationStep, setTrashConfirmationStep] = useState(1);

  const openConfirmation = (decision: ConfirmDecision) => {
    setTrashConfirmationStep(1);
    setPendingDecision(decision);
  };
  const handleConfirmCancel = () => {
    setTrashConfirmationStep(1);
    setPendingDecision(null);
  };
  const handleConfirmDecision = () => {
    if (!pendingDecision) {
      return;
    }

    if (pendingDecision === "trashed" && trashConfirmationStep === 1) {
      setTrashConfirmationStep(2);
      return;
    }

    const nextStatus = pendingDecision;
    setTrashConfirmationStep(1);
    setPendingDecision(null);
    onDecision(nextStatus);
  };

  const confirmCopy = pendingDecision
    ? pendingDecision === "trashed" && trashConfirmationStep === 2
      ? {
          ...CONFIRM_COPY.trashed,
          title: "Confirm move to trash",
          body: "The submission will now leave all active queues. Only an administrator can restore it to pending review.",
          actionLabel: "Move to Trash",
        }
      : pendingDecision === "for_review" && status === "trashed"
        ? {
            ...CONFIRM_COPY.for_review,
            title: "Restore this submission to review?",
            body: "This will return the submission to the pending review queue for a fresh moderator decision.",
            actionLabel: "Restore to Review",
          }
        : CONFIRM_COPY[pendingDecision]
    : null;
  const confirmIcon = confirmCopy?.icon === "trash"
    ? <Trash2 size={13} aria-hidden />
    : confirmCopy?.icon === "review"
      ? <RotateCcw size={13} aria-hidden />
      : confirmCopy?.icon === "flag"
        ? <Flag size={13} aria-hidden />
        : <CheckCircle2 size={13} aria-hidden />;
  const alreadyDecided = status === "trashed";
  const decisionDisabled = isSubmitting || isMetadataEditActive;

  return (
    <>
      <div className={styles.actions}>
        <p className={styles.sectionLabel}>Decision</p>

        {canSendBackToReview(status) ? (
          <div className={styles.primaryActions}>
            <p className={styles.statusNote}>
              This submission has been approved.
            </p>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="w-full"
              onClick={() => openConfirmation("for_review")}
              disabled={decisionDisabled}
              aria-label="Send submission back to review"
            >
              <RotateCcw size={14} aria-hidden />
              Send Back to Review
            </Button>
            {role === "admin" && (
              <Button
                type="button"
                variant="destructive"
                size="lg"
                className="w-full"
                onClick={() => openConfirmation("trashed")}
                disabled={decisionDisabled}
                aria-label="Move submission to trash"
              >
                <Trash2 size={14} aria-hidden />
                Trash
              </Button>
            )}
          </div>
        ) : alreadyDecided ? (
          <div className={styles.primaryActions}>
            <p className={styles.statusNote}>
              This submission has been trashed.
            </p>
            {role === "admin" && (
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="w-full"
                onClick={() => openConfirmation("for_review")}
                disabled={decisionDisabled}
                aria-label="Restore submission to review"
              >
                <RotateCcw size={14} aria-hidden />
                Restore to Review
              </Button>
            )}
          </div>
        ) : status === "flagged" ? (
          <div className={styles.primaryActions}>
            <p className={styles.statusNote}>
              This submission is with the member for revision. You can add
              further feedback without changing its status.
            </p>
            {role === "admin" && (
              <Button
                type="button"
                variant="destructive"
                size="lg"
                className="w-full"
                onClick={() => openConfirmation("trashed")}
                disabled={decisionDisabled}
                aria-label="Move submission to trash"
              >
                <Trash2 size={14} aria-hidden />
                Trash
              </Button>
            )}
          </div>
        ) : (
          <div className={styles.primaryActions}>
            {/* Accept */}
            <Button
              type="button"
              variant="default"
              size="lg"
              className="w-full"
              onClick={() => openConfirmation("accepted")}
              disabled={decisionDisabled || !canAccept(status)}
              aria-label="Approve this submission"
            >
              <CheckCircle2 size={15} aria-hidden />
              Approve
            </Button>

            {/* Flag for member-side revision. Members return it to pending by resubmitting. */}
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => openConfirmation("flagged")}
              disabled={decisionDisabled || !canFlag(status)}
              aria-label="Flag submission for member revision"
            >
              <Flag size={14} aria-hidden />
              Flag for Revision
            </Button>

            {/* Trash — soft destructive, requires confirm */}
            {role === "admin" && (
              <Button
                type="button"
                variant="destructive"
                size="lg"
                className="w-full"
                onClick={() => openConfirmation("trashed")}
                disabled={decisionDisabled || !canTrash(status)}
                aria-label="Move submission to trash"
              >
                <Trash2 size={14} aria-hidden />
                Trash
              </Button>
            )}
          </div>
        )}

        {/* ── Staff controls ──────────────────────────────────────────────── */}
        {role === "admin" && (
          <>
            <div className={styles.adminDivider} role="separator" />
            <div className={styles.adminSection}>
              <p className={styles.adminLabel}>
                <ShieldAlert size={12} aria-hidden />
                Staff Controls
              </p>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full justify-start border-[var(--color-chip-cyan-bd)] bg-[var(--color-chip-cyan-bg)] text-[var(--color-chip-cyan-text)] hover:bg-[var(--color-chip-cyan-bg)]/80"
                onClick={onAdminDirectEdit}
                disabled={isSubmitting || status === "trashed" || !onAdminDirectEdit}
                title={
                  status === "trashed"
                    ? "Restore the submission before correcting metadata"
                    : isAdminDirectEditing
                      ? "Exit direct metadata edit mode"
                      : "Edit submission metadata in place"
                }
                aria-label={isAdminDirectEditing ? "Exit direct metadata edit mode" : "Edit submission metadata in place"}
                aria-pressed={isAdminDirectEditing}
              >
                <Pencil size={13} aria-hidden />
                {isAdminDirectEditing ? "Exit Edit Mode" : "Edit Metadata"}
              </Button>
              <p className={styles.adminNote}>
                Direct edits keep the current review status and require an audit reason.
              </p>
            </div>
          </>
        )}
      </div>

      {confirmCopy && (
        <ConfirmDialog
          open
          title={confirmCopy.title}
          description={confirmCopy.body}
          confirmLabel={confirmCopy.actionLabel}
          confirmIntent={confirmCopy.confirmIntent}
          confirmIcon={confirmIcon}
          isSubmitting={isSubmitting}
          onCancel={handleConfirmCancel}
          onConfirm={handleConfirmDecision}
        />
      )}
    </>
  );
}
