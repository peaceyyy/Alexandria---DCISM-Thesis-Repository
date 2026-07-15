"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, MessageSquare, Send, X } from "lucide-react";
import { createPortal } from "react-dom";
import type { ReviewComment, ReviewFieldKey } from "./types";
import { REVIEW_FIELD_LABEL } from "./types";
import { getCommentCorrectionState } from "@/lib/review/correction-state";
import styles from "./comment-side-panel.module.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (days > 30)
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (mins > 1) return `${mins}m ago`;
  return "just now";
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CommentSidePanelProps {
  /** Which field is currently active. Null = panel closed. */
  fieldKey: ReviewFieldKey | null;
  /**
   * Viewport-relative Y of the field's top edge.
   * Panel will be clamped to stay within viewport.
   */
  anchorY: number;
  comments: ReviewComment[];
  canComment: boolean;
  onAddComment: (fieldKey: ReviewFieldKey, comment: string) => void;
  onMarkAddressed?: (commentId: number) => void;
  isMarkingAddressed?: boolean;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CommentSidePanel({
  fieldKey,
  anchorY,
  comments,
  canComment,
  onAddComment,
  onMarkAddressed,
  isMarkingAddressed = false,
  onClose,
}: CommentSidePanelProps) {
  const [draft, setDraft] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [showScroll, setShowScroll] = useState(false);

  const handleScroll = () => {
    if (listRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = listRef.current;
      setShowScroll(scrollHeight > clientHeight && scrollTop + clientHeight < scrollHeight - 5);
    }
  };

  useEffect(() => {
    handleScroll();
  }, [fieldKey, comments]);
  const PANEL_HEIGHT = 420;
  const MARGIN = 16;
  const viewportHeight =
    typeof window === "undefined"
      ? PANEL_HEIGHT + MARGIN * 2
      : window.innerHeight;

  // Clamp top so panel stays in viewport
  const top = Math.min(
    Math.max(anchorY, MARGIN),
    viewportHeight - PANEL_HEIGHT - MARGIN,
  );

  // Reset draft when switching fields
  useEffect(() => {
    setDraft("");
  }, [fieldKey]);

  // Auto-focus textarea when panel opens with canComment
  useEffect(() => {
    if (canComment && textareaRef.current) {
      // Short delay so the entrance animation doesn't fight focus
      const t = setTimeout(() => textareaRef.current?.focus(), 180);
      return () => clearTimeout(t);
    }
  }, [fieldKey, canComment]);

  // Keyboard: Escape closes
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handleSubmit = () => {
    const trimmed = draft.trim();
    if (!trimmed || !fieldKey) return;
    onAddComment(fieldKey, trimmed);
    setDraft("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter without Shift
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!fieldKey) return null;

  const label = REVIEW_FIELD_LABEL[fieldKey];
  const fieldComments = comments.filter((c) => c.fieldKey === fieldKey);

  const panel = (
    <>
      {/* Click-away catcher */}
      <div className={styles.overlay} onClick={onClose} aria-hidden />

      <div
        ref={panelRef}
        className={styles.panel}
        style={{ top }}
        role="dialog"
        aria-modal="false"
        aria-label={`Comments on ${label}`}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <MessageSquare size={13} color="#1da0c9" aria-hidden />
            <span className={styles.fieldLabel}>{label}</span>
            {fieldComments.length > 0 && (
              <span className={styles.commentCountBadge}>
                {fieldComments.length}
              </span>
            )}
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close comment panel"
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Comment List ─────────────────────────────────────────────── */}
        <div ref={listRef} className={styles.commentList} onScroll={handleScroll} aria-label={`Comments on ${label}`}>
          {fieldComments.length === 0 ? (
            <p className={styles.emptyState}>
              No comments on {label.toLowerCase()} yet.
              {canComment && (
                <><br />Be the first to leave a note.</>
              )}
            </p>
          ) : (
            fieldComments.map((c) => (
              <div key={c.id} className={styles.commentItem}>
                <div className={styles.commentMeta}>
                  <div style={{ display: "flex", gap: 7, alignItems: "baseline", flex: 1, flexWrap: "wrap" }}>
                    <span className={styles.commentAuthor}>{c.createdByName}</span>
                    <time
                      className={styles.commentTime}
                      dateTime={c.createdAt}
                      title={new Date(c.createdAt).toLocaleString()}
                    >
                      {formatRelativeTime(c.createdAt)}
                    </time>
                    {(() => {
                      const state = getCommentCorrectionState(c);
                      const label = state === "addressed"
                        ? "Marked addressed"
                        : state === "revised"
                          ? "Field revised"
                          : "Needs attention";

                      return (
                        <span className={`${styles.correctionState} ${styles[`correctionState${state}`]}`}>
                          {label}
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <p className={styles.commentText}>{c.comment}</p>
                {onMarkAddressed && (
                  <button
                    type="button"
                    className={styles.addressButton}
                    onClick={() => onMarkAddressed(c.id)}
                    disabled={!c.memberRevisedAt || Boolean(c.addressedAt) || isMarkingAddressed}
                  >
                    <Check size={12} aria-hidden />
                    {c.addressedAt
                      ? "Marked addressed"
                      : c.memberRevisedAt
                        ? "Mark as addressed"
                        : `Edit ${label} and save first`}
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Scroll Indicator */}
        {showScroll && (
          <div className={styles.scrollIndicator}>
            <ChevronDown size={14} color="#5a6070" aria-hidden />
          </div>
        )}

        {/* ── Add Comment ──────────────────────────────────────────────── */}
        {canComment && (
          <div className={styles.addForm}>
            <textarea
              ref={textareaRef}
              id={`comment-input-${fieldKey}`}
              className={styles.textarea}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Note on ${label.toLowerCase()}…`}
              rows={3}
              aria-label={`Add a comment on ${label}`}
            />
            <div className={styles.formFooter}>
              <span className={styles.hint}>↵ to post</span>
              <button
                type="button"
                className={styles.submitBtn}
                onClick={handleSubmit}
                disabled={!draft.trim()}
                aria-label="Post comment"
              >
                <Send size={11} aria-hidden />
                Post
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );

  // Render into document.body via portal so fixed positioning works correctly
  // regardless of scroll containers or stacking contexts.
  return typeof document !== "undefined"
    ? createPortal(panel, document.body)
    : null;
}
