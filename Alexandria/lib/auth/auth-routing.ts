import type { UserRole } from "./auth-contract";

/**
 * Determines where to send a user after successful login based on their role.
 * - admin     → /admin/dashboard   (task-first: management is their primary job)
 * - moderator → /admin/dashboard   (shared operational dashboard)
 * - member    → /home              (reader-first: the public repository)
 */
export function getPostAuthDestination(role?: UserRole): string {
  switch (role) {
    case "admin":
    case "moderator":
      return "/admin/dashboard";
    default:
      return "/home";
  }
}
