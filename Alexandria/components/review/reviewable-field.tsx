"use client";

import { useRef, useState } from "react";
import { MessageSquare } from "lucide-react";
import type { ReviewComment, ReviewFieldKey } from "./types";
import styles from "./reviewable-field.module.css";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ReviewableFieldProps {
  fieldKey: ReviewFieldKey;
  label: string;
  comments: ReviewComment[];
  /** Whether this field is the currently-active comment target. */
  isActive: boolean;
  /**
   * Called when the comment icon is clicked.
   * Parent receives the fieldKey + the field's top Y position (viewport-relative)
   * so the floating panel can anchor itself vertically.
   */
  onCommentIconClick: (fieldKey: ReviewFieldKey, anchorY: number) => void;
  children: React.ReactNode;
  className?: string;
  /**
   * When true, the field content is initially collapsed to 4 lines.
   * The user can toggle it open to read the full text.
   * The comment trigger always remains accessible in the header.
   */
  expandable?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ReviewableField({
  fieldKey,
  label,
  comments,
  isActive,
  onCommentIconClick,
  children,
  className,
  expandable = false,
}: ReviewableFieldProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const hasComments = comments.length > 0;

  const handleIconClick = () => {
    if (!rootRef.current) return;
    const rect = rootRef.current.getBoundingClientRect();
    onCommentIconClick(fieldKey, rect.top);
  };

  const containerClass = [
    styles.field,
    hasComments || isActive ? styles.fieldWithComments : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  const triggerClass = [
    styles.commentTrigger,
    hasComments || isActive ? styles.commentTriggerActive : "",
  ].join(" ");

  return (
    <div ref={rootRef} className={containerClass}>
      {/* ── Field Header ───────────────────────────────────────────────── */}
      <div className={styles.fieldHeader}>
        <span className={styles.label}>{label}</span>

        {/* Comment icon — always in the DOM but opacity-hidden until hover */}
        <button
          type="button"
          className={triggerClass}
          onClick={handleIconClick}
          aria-label={
            hasComments
              ? `${comments.length} comment${comments.length !== 1 ? "s" : ""} on ${label}`
              : `Comment on ${label}`
          }
          title={hasComments ? `${comments.length} comment${comments.length !== 1 ? "s" : ""}` : "Add a comment"}
        >
          <MessageSquare size={13} aria-hidden />
          {hasComments && <span className={styles.commentLabel}>Feedback</span>}
          {hasComments && (
            <span className={styles.commentCount} aria-hidden>
              {comments.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Field Content ────────────────────────────────────────────────── */}
      {expandable ? (
        <>
          <div className={isExpanded ? styles.contentExpanded : styles.contentCollapsed}>
            {children}
          </div>
          <button
            type="button"
            className={styles.expandToggle}
            onClick={() => setIsExpanded((v) => !v)}
            aria-expanded={isExpanded}
          >
            {isExpanded ? "Show less" : "Show more →"}
          </button>
        </>
      ) : (
        children
      )}
    </div>
  );
}
