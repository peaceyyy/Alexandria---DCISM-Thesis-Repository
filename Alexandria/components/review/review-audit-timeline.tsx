import {
  CheckCircle2,
  FileText,
  Flag,
  MessageSquare,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react";
import type { ReviewAuditEvent, ReviewAuditEventType } from "./types";
import styles from "./review-audit-timeline.module.css";

// ─── Icon + style mapping per event type ──────────────────────────────────────

const EVENT_CONFIG: Record<
  ReviewAuditEventType,
  { icon: React.ElementType; dotClass: string }
> = {
  submitted:         { icon: FileText,      dotClass: styles.iconDotSubmitted },
  comment_added:     { icon: MessageSquare, dotClass: styles.iconDotComment },
  comment_addressed: { icon: CheckCircle2,  dotClass: styles.iconDotStatus },
  status_changed:    { icon: CheckCircle2,  dotClass: styles.iconDotStatus },
  metadata_edited:   { icon: Pencil,        dotClass: styles.iconDotEdit },
  pdf_replaced:      { icon: FileText,      dotClass: styles.iconDotEdit },
  resubmitted:       { icon: RotateCcw,     dotClass: styles.iconDotFlagged },
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ReviewAuditTimelineProps {
  /**
   * Audit events sorted descending (newest first).
   * When connecting to the backend, query thesis_audits ordered by
   * updated_at DESC and map to ReviewAuditEvent shape.
   */
  events: ReviewAuditEvent[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ReviewAuditTimeline({ events }: ReviewAuditTimelineProps) {
  return (
    <div>
      <p className={styles.sectionLabel}>Activity</p>

      {events.length === 0 ? (
        <p className={styles.empty}>No recorded activity yet.</p>
      ) : (
        <ol className={styles.timeline} aria-label="Review activity timeline">
          {events.map((ev) => {
            const config = EVENT_CONFIG[ev.event];
            const Icon = config.icon;

            return (
              <li key={ev.id} className={styles.event}>
                {/* Icon dot */}
                <div className={styles.iconCol}>
                  <span className={`${styles.iconDot} ${config.dotClass}`} aria-hidden>
                    <Icon size={13} />
                  </span>
                </div>

                {/* Text */}
                <div className={styles.content}>
                  <p className={styles.description}>{ev.description}</p>
                  <div className={styles.meta}>
                    <span className={styles.byName}>{ev.createdByName}</span>
                    <span className={styles.timeSep} aria-hidden>·</span>
                    <time
                      className={styles.time}
                      dateTime={ev.createdAt}
                      title={formatDateTime(ev.createdAt)}
                    >
                      {formatDateTime(ev.createdAt)}
                    </time>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
