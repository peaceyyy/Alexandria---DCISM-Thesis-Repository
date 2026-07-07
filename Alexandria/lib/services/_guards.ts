import { createClient } from "../supabase/server";
import { makeError } from "./result";
import type { CurrentUser, UserRole } from "./types";
import { getCurrentUser } from "./auth-service";

/**
 * Resolves the current Supabase session and returns the CurrentUser profile.
 * Returns a FORBIDDEN ServiceError if there is no active session.
 * Call at the top of any protected service function.
 */
export async function requireSession(): Promise<CurrentUser> {
  const result = await getCurrentUser();
  if (result.error || !result.data) {
    if (result.error?.code === "ACCOUNT_DEACTIVATED") {
      throw result.error;
    }
    throw makeError("UNAUTHENTICATED", "Active session is required.");
  }
  return result.data;
}

/**
 * Resolves the current user and asserts their role is in allowedRoles.
 * Returns a FORBIDDEN ServiceError if the role check fails.
 * Call after requireSession() in admin/moderator-only functions.
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<CurrentUser> {
  const user = await requireSession();
  if (!allowedRoles.includes(user.role)) {
    throw makeError("FORBIDDEN", "You do not have the required role to perform this action.");
  }
  return user;
}

/**
 * Asserts that the current user is the owner of a given thesis.
 * Ownership is checked against theses.submitted_by_user_id.
 * Returns a FORBIDDEN ServiceError if the user is not the owner.
 * Used to gate member edit and file-registration flows.
 */
export async function requireOwnership(thesisId: number, currentUserId: string): Promise<void> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("theses")
    .select("submitted_by_user_id")
    .eq("id", thesisId)
    .single();

  if (error || !data) {
    throw makeError("NOT_FOUND", "Thesis not found.");
  }

  if (data.submitted_by_user_id !== currentUserId) {
    throw makeError("FORBIDDEN", "You are not the owner of this thesis.");
  }
}
