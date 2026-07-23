import type { ReviewStatus } from "@/lib/services/types";
import { WorkflowStatus } from "@/components/ui/workflow-status";

export function StatusBadge({ status }: { status: ReviewStatus }) {
  return <WorkflowStatus status={status} />;
}
