import styles from "./status-badge.module.css";

export type AdminStatus =
  | "for_review"
  | "accepted"
  | "flagged"
  | "trashed"
  | "active"
  | "deactivated"
  | "protected";

const STATUS_MAP: Record<AdminStatus, { label: string; className: string }> = {
  for_review: { label: "Pending", className: styles.pending },
  accepted: { label: "Approved", className: styles.approved },
  flagged: { label: "Flagged", className: styles.flagged },
  trashed: { label: "Trashed", className: styles.trashed },
  active: { label: "Active", className: styles.approved },
  deactivated: { label: "Deactivated", className: styles.deactivated },
  protected: { label: "Protected", className: styles.protected },
};

export function StatusBadge({ status }: { status: AdminStatus }) {
  const { label, className } = STATUS_MAP[status];
  return <span className={`${styles.badge} ${className}`}>{label}</span>;
}
