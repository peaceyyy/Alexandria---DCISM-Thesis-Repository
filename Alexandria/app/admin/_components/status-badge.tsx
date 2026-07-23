import type { ReviewStatus } from "@/lib/services/types";
import { WorkflowStatus } from "@/components/ui/workflow-status";
import styles from "./status-badge.module.css";

export type AdminStatus =
  | "for_review"
  | "accepted"
  | "flagged"
  | "trashed"
  | "active"
  | "deactivated"
  | "protected";

const ACCOUNT_STATUS_MAP: Record<
  Exclude<AdminStatus, ReviewStatus>,
  { label: string; className: string }
> = {
  active: { label: "Active", className: styles.approved },
  deactivated: { label: "Deactivated", className: styles.deactivated },
  protected: { label: "Protected", className: styles.protected },
};

function isWorkflowStatus(status: AdminStatus): status is ReviewStatus {
  return status === "for_review" || status === "accepted" || status === "flagged" || status === "trashed";
}

export function StatusBadge({
  status,
  quietSettled = false,
}: {
  status: AdminStatus;
  quietSettled?: boolean;
}) {
  if (isWorkflowStatus(status)) {
    return <WorkflowStatus status={status} emphasis={quietSettled ? "quiet" : "standard"} />;
  }

  const { label, className } = ACCOUNT_STATUS_MAP[status];
  return <span className={`${styles.badge} ${className}`}>{label}</span>;
}
