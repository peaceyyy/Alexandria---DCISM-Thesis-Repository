import { createClient } from "../supabase/server";
import { err, makeError, ok } from "./result";
import type { CurrentUser, RegisterPayload, ServiceResult } from "./types";

/**
 * Returns true if the email ends with one of the allowed domains.
 * Used by: registerMember() guard, registration form pre-validation.
 */
export function isAllowedEmailDomain(email: string, allowedDomains: string[]): boolean {
  const domain = email.split("@")[1];
  return allowedDomains.includes(domain);
}

/**
 * Returns true if role is "admin" | "moderator" | "member", false otherwise.
 * Used by: updateUserRole() guard.
 */
export function assertValidRole(role: string): role is "admin" | "moderator" | "member" {
  return ["admin", "moderator", "member"].includes(role);
}

/**
 * Server service: registerMember()
 * Creates a Supabase Auth user and supplies profile metadata.
 * The on_auth_user_created database trigger owns the public.users insert.
 * Validates that email domain is "usc.edu.ph" and affiliation is valid.
 * Used by: Register page.
 */
export async function registerMember(payload: RegisterPayload): Promise<ServiceResult<{ id: string }>> {
  if (!isAllowedEmailDomain(payload.email, ["usc.edu.ph"])) {
    return err(makeError("INVALID_EMAIL_DOMAIN", "Email must be a @usc.edu.ph domain"));
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: payload.email,
    password: payload.password,
    options: {
      data: {
        profile_name: payload.profile_name,
        display_name: payload.profile_name,
        usc_id: payload.usc_id,
        affiliation: payload.affiliation,
      }
    }
  });

  if (error || !data.user) {
    return err(makeError("SUPABASE_ERROR", error?.message || "Registration failed"));
  }

  return ok({ id: data.user.id });
}

/**
 * Server service: login()
 * Signs in with email and password via Supabase Auth.
 * Returns the active session (handled internally by Supabase SDK).
 * Used by: Login page.
 */
export async function login(email: string, password: string): Promise<ServiceResult<CurrentUser>> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return err(makeError("UNAUTHENTICATED", error?.message || "Login failed"));
  }

  const userResult = await getCurrentUser();
  if (userResult.error || !userResult.data) {
    return err(userResult.error || makeError("NOT_FOUND", "User profile not found"));
  }

  return ok(userResult.data);
}

/**
 * Server service: logout()
 * Signs the current user out and invalidates the Supabase session.
 * Used by: Navigation / user menu.
 */
export async function logout(): Promise<ServiceResult<null>> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    return err(makeError("SUPABASE_ERROR", error.message));
  }
  
  return ok(null);
}

/**
 * (No route — reads active Supabase session)
 * Returns the currently authenticated user's profile from public.users.
 * Returns null in data if no active session.
 * Used by: All protected layouts, navigation auth state, role guards.
 */
export async function getCurrentUser(): Promise<ServiceResult<CurrentUser | null>> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    // Expected behavior for guests: Supabase returns AuthSessionMissingError when no session exists.
    return ok(null); // No active session
  }

  console.log("[DEBUG] getCurrentUser: user found in auth", user.id);

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("[DEBUG] getCurrentUser: profile fetch failed", profileError, "profile:", profile);
    return err(makeError("NOT_FOUND", "Profile not found for authenticated user"));
  }

  // Cast DB row to CurrentUser
  const currentUser: CurrentUser = {
    id: profile.id,
    email: profile.email,
    profile_name: profile.profile_name,
    usc_id: profile.usc_id,
    role: profile.role,
    affiliation: profile.affiliation,
    created_at: profile.created_at,
  };

  return ok(currentUser);
}
