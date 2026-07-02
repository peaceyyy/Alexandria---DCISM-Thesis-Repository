# Admin Dashboard Backend Integration Contract Freeze

Status: Approved  
Owner: Homer  
Approved: 2026-07-01

## Scope

This contract governs live Supabase data for `/admin/dashboard`, `/admin/members`, and `/admin/moderators`, plus reversible account deactivation as observed by authenticated users.

## Dashboard Snapshot

`getAdminDashboardSnapshot()` is available to `admin` and `moderator` roles and returns one serializable `ServiceResult<AdminDashboardSnapshot>`.

```ts
type AdminDashboardSnapshot = {
  viewer: { profile_name: string };
  metrics: {
    total_research: number;
    registered_users: number;
    pending_docs: number;
  };
  recent_uploads: DashboardUploadRow[];
  recent_activity: DashboardActivityRow[];
  research_by_department: DepartmentResearchCount[];
};

type DashboardUploadRow = {
  id: number;
  title: string;
  author: string;
  created_at: string;
  review_status: ReviewStatus;
};

type DashboardActivityRow = {
  id: number;
  thesis_id: number;
  text: string;
  occurred_at: string;
};

type DepartmentResearchCount = {
  department: string;
  count: number;
};
```

### Frozen Query Semantics

- `total_research`: count `theses` where `review_status <> 'trashed'`.
- `registered_users`: count active `users` across all roles, where `deactivated_at IS NULL`.
- `pending_docs`: count `theses` where `review_status = 'for_review'`.
- `research_by_department`: group all non-trashed theses by the stored `department` value. `DCISM` is the current default; future department values appear automatically.
- `recent_uploads`: newest five non-trashed theses by `created_at DESC`; author is the first `thesis_authors` row with `contribution_role = 'author'`, ordered by `sort_order` then `id`; fall back to `Unknown author`.
- `recent_activity`: newest five `thesis_audits` rows by `updated_at DESC`. Do not synthesize registration or upload events that lack an audit row.
- UI mapping: `for_review → Pending`, `accepted → Approved`, `flagged → Flagged`. Trashed rows do not appear in dashboard lists.

## User Management

- `/admin/members` requests `getUsers({ role: "member" })`.
- `/admin/moderators` requests `getUsers({ role: "moderator" })`.
- Default page size is 20; list results include pagination metadata.
- Only an active `admin` may read these lists or mutate roles/account status.
- UI role transitions are limited to `member → moderator` and `moderator → member`.
- Admin creation, profile editing, hard deletion, and assigning the `admin` role are not part of this phase.

`UserAdminRow` adds:

```ts
{
  deactivated_at: string | null;
  deactivation_reason: string | null;
  deactivated_by_user_id: string | null;
}
```

## Reversible Account Deactivation

- `deactivateUser(userId, reason)` targets only member/moderator accounts.
- `reason` is required after trimming and must be suitable for an administrator audit note.
- The mutation sets `deactivated_at`, `deactivation_reason`, and `deactivated_by_user_id`.
- `reactivateUser(userId)` clears those three current-state fields.
- Deactivation never deletes `auth.users`, `public.users`, submissions, or thesis credits.
- The acting admin cannot deactivate themselves. Admin targets are excluded from this UI and service operation.
- The members/moderators tables show Active or Deactivated and switch the row action between Deactivate and Reactivate.
- Successful role or status changes revalidate `/admin/dashboard`, `/admin/members`, and `/admin/moderators`.

## User-Side Enforcement

- `ACCOUNT_DEACTIVATED` is a stable `ServiceError.code`.
- After valid credentials, `login()` checks the profile. A deactivated profile is immediately signed out and receives `ACCOUNT_DEACTIVATED`.
- `getCurrentUser()` and `requireSession()` reject deactivated profiles even when an older Supabase session cookie remains valid.
- Existing protected services that read `supabase.auth.getUser()` directly must move to the active-session guard.
- Protected routes redirect a deactivated session to `/login?reason=account-deactivated`.
- The login page explains that an administrator must reactivate the account.
- Public repository browsing remains available as a signed-out guest.

## Security and Data Rules

- RLS must enforce active-account and role checks; layouts alone are not authorization.
- No Supabase service-role key may enter a `NEXT_PUBLIC_*` variable, Client Component, or browser request.
- No runtime mock fallback is allowed when a live service fails.
- SQL migrations and live Supabase changes remain behind human review.

## Human Review Gate

Coding agents may write production and test files, but must not execute tests, lint, type-checking, builds, development servers, Supabase migrations, or browser automation. Non-browser verification unlocks only after `Human review approved; run verification.` E2E/browser work requires separate explicit approval.
