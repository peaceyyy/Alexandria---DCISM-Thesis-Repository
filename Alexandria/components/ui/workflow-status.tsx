import type { ReviewStatus } from "@/lib/services/types";
import styles from "./workflow-status.module.css";

export const WORKFLOW_STATUS_META: Record<
  ReviewStatus,
  { label: string; description: string; tone: "review" | "published" | "revision" | "archived" }
> = {
  for_review: {
    label: "Under review",
    description: "This submission is awaiting a moderator decision.",
    tone: "review",
  },
  accepted: {
    label: "Published",
    description: "This submission is published in the repository.",
    tone: "published",
  },
  flagged: {
    label: "Needs revision",
    description: "This submission needs member revisions before it can be reviewed again.",
    tone: "revision",
  },
  trashed: {
    label: "Archived",
    description: "This submission has been removed from active queues and browsing.",
    tone: "archived",
  },
};

const TONE_CLASS = {
  review: styles.review,
  published: styles.published,
  revision: styles.revision,
  archived: styles.archived,
};

interface WorkflowStatusProps {
  status: ReviewStatus;
  size?: "default" | "compact";
  emphasis?: "standard" | "quiet";
  className?: string;
}

/**
 * A read-only marker for the thesis review lifecycle. It deliberately does not
 * share the interaction language of filters, removable tags, or action buttons.
 */
export function WorkflowStatus({
  status,
  size = "default",
  emphasis = "standard",
  className,
}: WorkflowStatusProps) {
  const { label, description, tone } = WORKFLOW_STATUS_META[status];
  const isSettled = status === "accepted" || status === "trashed";

  return (
    <span
      className={[
        styles.status,
        styles[size],
        TONE_CLASS[tone],
        emphasis === "quiet" && isSettled ? styles.quiet : undefined,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-status={status}
      title={description}
    >
      {label}
    </span>
  );
}
