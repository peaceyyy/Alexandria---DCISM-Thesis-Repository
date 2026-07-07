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
  ServiceResult,
  UserAdminRow,
  UserListParams,
  UserRole,
  UserRoleCounts,
} from "./types";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const LISTABLE_ROLES: UserRole[] = ["member", "moderator", "admin"];
const MANAGEABLE_ROLES: UserRole[] = ["member", "moderator"];

function normalizedPage(value?: number) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    return 1;
  }

  return value;
}

function normalizedLimit(value?: number) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    return DEFAULT_PAGE_SIZE;
  }

  return Math.min(value, MAX_PAGE_SIZE);
}

type SupabaseMutationError = {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
};

function isSupabaseMutationError(value: unknown): value is SupabaseMutationError {
  return Boolean(
    value
      && typeof value === "object"
      && "message" in value
      && typeof (value as SupabaseMutationError).message === "string",
  );
}

function mutationError(error: unknown, fallbackMessage: string) {
  if (!isSupabaseMutationError(error)) {
    return makeError("SUPABASE_ERROR", fallbackMessage);
  }

  const message = error.message || fallbackMessage;
  const safeMessages = new Set([
    "An active administrator account is required",
    "Role must be member or moderator",
    "User was not found",
    "Administrator roles are protected",
    "Reactivate the account before changing its role",
    "That role transition is not allowed",
    "Administrators cannot deactivate themselves",
    "A deactivation reason is required",
    "Administrator accounts cannot be deactivated here",
    "Administrator accounts cannot be changed here",
  ]);

  console.error("[admin:user-management] Supabase mutation failed", {
    code: error.code,
    message,
    details: error.details,
    hint: error.hint,
  });

  return makeError(
    "SUPABASE_ERROR",
    safeMessages.has(message) ? message : fallbackMessage,
    error.code ? { supabase_code: error.code } : undefined,
  );
}

export async function getUsers(
  params: UserListParams = {},
): Promise<ServiceResult<UserAdminRow[]>> {
  try {
    await requireRole(["admin"]);

    if (params.role && !LISTABLE_ROLES.includes(params.role)) {
      return err(
        makeError(
          "VALIDATION_FAILED",
          "Only member, moderator, and administrator accounts can be listed here.",
        ),
      );
    }

    const page = normalizedPage(params.page);
    const limit = normalizedLimit(params.limit);
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const supabase = await createClient();
    let query = supabase
      .from("users")
      .select(
        "id, email, profile_name, usc_id, role, affiliation, created_at, deactivated_at, deactivation_reason, deactivated_by_user_id",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, to);

    if (params.role) {
      query = query.eq("role", params.role);
    } else {
      query = query.in("role", LISTABLE_ROLES);
    }

    if (params.account_status === "active") {
      query = query.is("deactivated_at", null);
    }

    if (params.account_status === "deactivated") {
      query = query.not("deactivated_at", "is", null);
    }

    const { count, data, error } = await query;
    if (error) {
      return err(
        makeError("SUPABASE_ERROR", "The account list could not be loaded."),
      );
    }

    return ok((data ?? []) as UserAdminRow[], {
      total_count: count ?? 0,
      page,
      limit,
    });
  } catch (error) {
    return err(
      normalizeServiceError(error, "The account list could not be loaded."),
    );
  }
}

export async function getUserRoleCounts(): Promise<
  ServiceResult<UserRoleCounts>
> {
  try {
    await requireRole(["admin"]);
    const supabase = await createClient();
    const roles = ["member", "moderator", "admin"] as const;
    const responses = await Promise.all(
      roles.map((role) =>
        supabase
          .from("users")
          .select("id", { count: "exact", head: true })
          .eq("role", role),
      ),
    );

    if (responses.some((response) => response.error)) {
      return err(
        makeError("SUPABASE_ERROR", "The account totals could not be loaded."),
      );
    }

    return ok({
      member: responses[0].count ?? 0,
      moderator: responses[1].count ?? 0,
      admin: responses[2].count ?? 0,
    });
  } catch (error) {
    return err(
      normalizeServiceError(error, "The account totals could not be loaded."),
    );
  }
}

export async function updateUserRole(
  userId: string,
  role: UserRole,
): Promise<ServiceResult<null>> {
  try {
    await requireRole(["admin"]);

    if (!MANAGEABLE_ROLES.includes(role)) {
      return err(
        makeError(
          "VALIDATION_FAILED",
          "Role must be member or moderator.",
        ),
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.rpc("admin_update_user_role", {
      target_user_id: userId,
      new_role: role,
    });

    if (error) {
      return err(
        mutationError(error, "The account role could not be changed."),
      );
    }

    return ok(null);
  } catch (error) {
    return err(
      normalizeServiceError(error, "The account role could not be changed."),
    );
  }
}

export async function deactivateUser(
  userId: string,
  reason: string,
): Promise<ServiceResult<null>> {
  try {
    const actor = await requireRole(["admin"]);
    const normalizedReason = reason.trim();

    if (actor.id === userId) {
      return err(
        makeError(
          "FORBIDDEN",
          "Administrators cannot deactivate their own account.",
        ),
      );
    }

    if (!normalizedReason) {
      return err(
        makeError(
          "VALIDATION_FAILED",
          "A deactivation reason is required.",
        ),
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.rpc("admin_deactivate_user", {
      target_user_id: userId,
      reason: normalizedReason,
    });

    if (error) {
      return err(
        mutationError(error, "The account could not be deactivated."),
      );
    }

    return ok(null);
  } catch (error) {
    return err(
      normalizeServiceError(error, "The account could not be deactivated."),
    );
  }
}

export async function reactivateUser(
  userId: string,
): Promise<ServiceResult<null>> {
  try {
    await requireRole(["admin"]);
    const supabase = await createClient();
    const { error } = await supabase.rpc("admin_reactivate_user", {
      target_user_id: userId,
    });

    if (error) {
      return err(
        mutationError(error, "The account could not be reactivated."),
      );
    }

    return ok(null);
  } catch (error) {
    return err(
      normalizeServiceError(error, "The account could not be reactivated."),
    );
  }
}
