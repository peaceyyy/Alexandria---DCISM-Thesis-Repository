> [!TIP]
> **Plan Status: READY** — all dashboard, activity, and account-lifecycle choices are frozen.

# Admin Dashboard Backend Integration

## Goal

Replace the `/admin` mock data with guarded Supabase reads, role changes, and reversible account deactivation while preserving the completed frontend and reflecting account status throughout authenticated user flows.

## Frozen Choices

- **Dashboard metrics (Option A):** total research and department counts use every non-trashed thesis; registered users counts active accounts across all roles; pending docs means `for_review`.
- **Department expansion:** group by `theses.department`; `DCISM` appears now and future departments appear without a contract change. `trashed` is only an exclusion filter.
- **Recent activity:** audit-only from `thesis_audits`; registrations and uploads appear only if a corresponding audit event exists.
- **Account lifecycle:** admins may deactivate and reactivate member/moderator accounts. Deactivation preserves Supabase Auth and `public.users`, records status metadata, blocks authenticated services on the next request, signs the user out, and shows an account-deactivated notice. Hard deletion and browser-exposed Auth Admin credentials remain out of scope.

## Tasks

- [x] 1. Freeze Option A, the audit-only feed, account-status fields, allowed role transitions, and deactivation safeguards in `.agent/changes/phases/Homer/admin-dashboard/backend-integration/contract-freeze.md`. → Verify: no coding-agent task depends on an unresolved metric, UI, or mutation meaning.
- [ ] 2. Audit live Supabase schema and RLS; prepare reviewed migration SQL for `users.deactivated_at`, deactivation reason/actor metadata, admin update policies, and active-session enforcement without applying it yet. → Verify: every query/mutation has a documented policy path and no browser bundle needs a service-role key.
- [ ] 3. Add dashboard, user-status, and `ACCOUNT_DEACTIVATED` contracts to `Alexandria/lib/services/types.ts`, then implement `admin-dashboard-service.ts` and `user-service.ts` behind active-session role guards. → Verify: services return `ServiceResult`, pagination metadata, frontend-safe fields, and no raw privileged data.
- [ ] 4. Add Server Actions for approved role transitions, deactivation, and reactivation; map failures to UI-safe state and revalidate all three admin routes after success. → Verify: each action has one guarded Supabase write path and one deterministic refresh path.
- [ ] 5. Convert `/admin/dashboard` to server-owned loading and pass a serializable snapshot into a client presentation component; remove its `mock-data.ts` imports. → Verify: metrics, recent uploads, audit activity, and department counts all originate from the snapshot DTO.
- [ ] 6. Bind `/admin/members` and `/admin/moderators` to role-filtered users, showing active/deactivated status and exposing only approved role/status mutations. → Verify: both pages contain no mock imports, hard delete is absent, and moderator route access remains blocked.
- [ ] 7. Enforce deactivation in `getCurrentUser()`, `login()`, and protected guards; sign out a deactivated session and surface a stable notice on `/login`. → Verify: a deactivated account cannot use authenticated services while public browsing remains available as a guest.
- [ ] 8. Add focused service/action/component/auth tests and fixtures, but do not execute them. → Verify: written cases cover role denial, audit-only activity, pagination, status changes, deactivated login/session handling, and route revalidation.
- [ ] 9. Stop and present every changed file for human review. Only after the exact approval `Human review approved; run verification.` may an agent run unit tests, lint, type-checking, or builds; E2E/browser work needs separate explicit approval. → Verify: the handoff names what was and was not run.

## Done When

- [ ] All three admin pages render live Supabase data with explicit loading, empty, and error states.
- [ ] Approved role and account-status changes persist to `public.users` and appear on all affected pages after revalidation.
- [ ] Admin/moderator authorization and active-account checks are enforced in services/actions as well as layouts.
- [ ] Deactivated users receive an explicit notice and cannot use authenticated services until reactivated.
- [ ] Hard deletion and privileged browser-side Auth Admin operations are absent.
- [ ] Human review and the repository's separate verification/E2E gates are respected.

## Execution

Use `.agent/changes/phases/Homer/admin-dashboard/backend-integration/breakdown.yaml` as the coding-agent orchestrator. Live code paths override stale paths in the frontend completion report; approved API/backend documents override mock-data shapes.
