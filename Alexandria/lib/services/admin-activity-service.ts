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
  AdminActivityItem,
  AdminActivityListParams,
  PaginationMeta,
  ReviewAuditEventType,
  ServiceResult,
} from "./types";

export const ADMIN_ACTIVITY_PAGE_SIZE = 20;
const MAX_ACTIVITY_PAGE_SIZE = 100;

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

function normalizedPage(value?: number) {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : 1;
}

function normalizedLimit(value?: number) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    return ADMIN_ACTIVITY_PAGE_SIZE;
  }

  return Math.min(value, MAX_ACTIVITY_PAGE_SIZE);
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

function mapActivityItem(value: unknown): AdminActivityItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = asNumber(value.id);
  const thesisId = asNumber(value.thesis_id);
  if (!Number.isInteger(id) || id < 1 || !Number.isInteger(thesisId) || thesisId < 1) {
    return null;
  }

  const event = asString(value.event);
  return {
    id,
    thesisId,
    thesisTitle: asString(value.thesis_title).trim() || "Untitled thesis",
    actorName: asString(value.actor_name).trim() || "Unknown user",
    event: isReviewAuditEvent(event) ? event : "status_changed",
    description: asString(value.description).trim() || "Thesis activity recorded.",
    occurredAt: asString(value.occurred_at),
  };
}

function mapActivityPage(value: unknown): {
  items: AdminActivityItem[];
  meta: PaginationMeta;
} | null {
  if (!isRecord(value) || !Array.isArray(value.items)) {
    return null;
  }

  const page = asNumber(value.page);
  const limit = asNumber(value.limit);
  const totalCount = asNumber(value.total_count);
  if (
    !Number.isInteger(page) || page < 1
    || !Number.isInteger(limit) || limit < 1
    || !Number.isInteger(totalCount) || totalCount < 0
  ) {
    return null;
  }

  return {
    items: value.items.map(mapActivityItem).filter((item) => item !== null),
    meta: {
      page,
      limit,
      total_count: totalCount,
    },
  };
}

export async function listAdminActivity(
  params: AdminActivityListParams = {},
): Promise<ServiceResult<AdminActivityItem[]>> {
  try {
    await requireRole(["admin", "moderator"]);
    const page = normalizedPage(params.page);
    const limit = normalizedLimit(params.limit);
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_admin_activity_page", {
      target_page: page,
      target_limit: limit,
    });

    if (error) {
      return err(
        makeError("SUPABASE_ERROR", "The activity history could not be loaded."),
      );
    }

    const activityPage = mapActivityPage(data);
    if (!activityPage) {
      return err(
        makeError(
          "INVALID_RESPONSE",
          "The activity history returned an unexpected response.",
        ),
      );
    }

    return ok(activityPage.items, activityPage.meta);
  } catch (error) {
    return err(
      normalizeServiceError(error, "The activity history could not be loaded."),
    );
  }
}
