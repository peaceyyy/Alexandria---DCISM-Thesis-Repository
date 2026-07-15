import { AdminDataState } from "@/app/admin/_components/admin-data-state";
import { UserManagementView } from "@/app/admin/_components/user-management-view";
import { getCurrentUser } from "@/lib/services/auth-service";
import {
  getUserRoleCounts,
  getUsers,
} from "@/lib/services/user-service";
import type { UserRole } from "@/lib/services/types";

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePage(value?: string | string[]) {
  const parsed = Number(firstValue(value));
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function parseRole(value?: string | string[]): UserRole {
  const role = firstValue(value);
  return role === "moderator" || role === "admin" ? role : "member";
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    role?: string | string[];
    page?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const role = parseRole(params.role);
  const [viewerResult, usersResult, countsResult] = await Promise.all([
    getCurrentUser(),
    getUsers({
      role,
      page: parsePage(params.page),
      limit: 20,
    }),
    getUserRoleCounts(),
  ]);

  if (
    viewerResult.error
    || !viewerResult.data
    || usersResult.error
    || !usersResult.data
    || !usersResult.meta
    || countsResult.error
    || !countsResult.data
  ) {
    return (
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">User Management</h1>
        <AdminDataState
          title="Accounts unavailable"
          message={
            viewerResult.error?.message
            ?? usersResult.error?.message
            ?? countsResult.error?.message
            ?? "The account list could not be loaded."
          }
        />
      </div>
    );
  }

  return (
    <UserManagementView
      viewerName={viewerResult.data.profile_name}
      role={role}
      roleCounts={countsResult.data}
      pagination={usersResult.meta}
      rows={usersResult.data}
    />
  );
}
