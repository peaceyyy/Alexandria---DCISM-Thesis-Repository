"use server";

import { createClient } from "../supabase/server";
import { requireRole } from "./_guards";
import {
  err,
  makeError,
  normalizeServiceError,
  ok,
} from "./result";
import type {
  AdminDashboardSnapshot,
  AdminActivityItem,
  DashboardUploadRow,
  DepartmentResearchCount,
  ReviewAuditEventType,
  ServiceResult,
} from "./types";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asNumber(value: unknown) {
  return typeof value === "number" ? value : Number(value) || 0;
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function isVisibleReviewStatus(
  value: string,
): value is DashboardUploadRow["review_status"] {
  return ["for_review", "flagged", "accepted"].includes(value);
}

function isReviewAuditEvent(value: string): value is ReviewAuditEventType {
  return [
    "submitted",
    "comment_added",
    "comment_addressed",
    "status_changed",
    "metadata_edited",
    "pdf_replaced",
    "resubmitted",
  ].includes(value);
}

function mapUpload(value: unknown): DashboardUploadRow | null {
  if (!isRecord(value)) {
    return null;
  }

  const reviewStatus = asString(value.review_status);
  if (!isVisibleReviewStatus(reviewStatus)) {
    return null;
  }

  return {
    id: asNumber(value.id),
    title: asString(value.title),
    author: asString(value.author) || "Unknown author",
    created_at: asString(value.created_at),
    review_status: reviewStatus,
  };
}

function mapActivity(value: unknown): AdminActivityItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const thesisId = asNumber(value.thesis_id);
  if (!Number.isInteger(thesisId) || thesisId < 1) {
    return null;
  }

  const event = asString(value.event);

  return {
    id: asNumber(value.id),
    thesisId,
    thesisTitle: asString(value.thesis_title).trim() || "Untitled thesis",
    actorName: asString(value.actor_name).trim() || "Unknown user",
    event: isReviewAuditEvent(event) ? event : "status_changed",
    description:
      asString(value.description).trim()
      || asString(value.text).trim()
      || "Thesis activity recorded.",
    occurredAt: asString(value.occurred_at),
  };
}

function mapDepartment(value: unknown): DepartmentResearchCount | null {
  if (!isRecord(value)) {
    return null;
  }

  const department = asString(value.department).trim();
  if (!department) {
    return null;
  }

  return {
    department,
    count: asNumber(value.count),
  };
}

function mapSnapshot(
  value: unknown,
  viewerName: string,
): AdminDashboardSnapshot | null {
  if (!isRecord(value) || !isRecord(value.metrics)) {
    return null;
  }

  const uploads = Array.isArray(value.recent_uploads)
    ? value.recent_uploads.map(mapUpload).filter((row) => row !== null)
    : [];
  const activity = Array.isArray(value.recent_activity)
    ? value.recent_activity.map(mapActivity).filter((row) => row !== null)
    : [];
  const departments = Array.isArray(value.research_by_department)
    ? value.research_by_department
        .map(mapDepartment)
        .filter((row) => row !== null)
    : [];

  return {
    viewer: { profile_name: viewerName },
    metrics: {
      total_research: asNumber(value.metrics.total_research),
      pending_docs: asNumber(value.metrics.pending_docs),
    },
    recent_uploads: uploads,
    recent_activity: activity,
    research_by_department: departments,
  };
}

export async function getAdminDashboardSnapshot(): Promise<
  ServiceResult<AdminDashboardSnapshot>
> {
  try {
    const viewer = await requireRole(["admin", "moderator"]);
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_admin_dashboard_snapshot");

    if (error) {
      return err(
        makeError(
          "SUPABASE_ERROR",
          "The admin dashboard data could not be loaded.",
        ),
      );
    }

    const snapshot = mapSnapshot(data, viewer.profile_name);
    if (!snapshot) {
      return err(
        makeError(
          "INVALID_RESPONSE",
          "The admin dashboard returned an unexpected response.",
        ),
      );
    }

    return ok(snapshot);
  } catch (error) {
    return err(
      normalizeServiceError(error, "The admin dashboard could not be loaded."),
    );
  }
}
