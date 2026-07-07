# Alexandria Backend Readiness Plan

Last updated: 2026-07-08

## Purpose

This document translates the latest API contracts and live Supabase SQL snapshot into backend/project-lead work that Homer can start now while the frontend pages are still being designed and coded.

Current implementation source files:

- `docs/api-contracts.md`
- `docs/sql/updated_db_fields.sql`
- `docs/DESIGN.md`

## Latest Backend State

The latest implementation direction has shifted from the earlier planning docs in several important ways.

| Area | Current State | Backend Impact |
| --- | --- | --- |
| Data access | Supabase JS client through a local service layer | Build `Alexandria/lib/services/` contracts first; keep UI away from raw Supabase queries |
| User table | `public.users` linked to `auth.users` | Use this as the app profile table |
| USC ID | Nullable for members who do not have a student ID | Drop the current `users.usc_id NOT NULL` constraint and stop substituting `0` in the signup trigger |
| System roles | `admin`, `moderator`, `member` | Replace older Admin/Contributor/Student visitor language in implementation |
| USC identity | `student`, `alumni`, `professor` in `users.affiliation` | Do not use affiliation for permission checks |
| Thesis lifecycle | `for_review`, `flagged`, `accepted`, `trashed` | Public repository queries must filter to approved/accepted records only and hide trashed records |
| PDF storage | Initial submissions upload to the private `thesis_files_bucket`; `thesis_files.storage_path` stores the canonical object key | Keep raw paths out of DTOs. Guests may preview accepted PDFs inline; explicit download requires an active account |
| Recommendations/lessons | Text fields on `theses` | Validate as required non-empty fields before acceptance |
| Related theses | Frontend-computed from tag overlap | Backend/service layer should provide enough accepted thesis/tag data |
| Audit trail | `thesis_audits.change_description` | Accept, flag, and trash actions should write readable descriptions |

## Locked Flow Decisions

These decisions came from project-lead clarification on 2026-06-26.

| Decision | Locked Behavior |
| --- | --- |
| Auth terminology | **Sign-up** creates/registers a new account through `registerMember()`. **Login** authenticates an existing account through `login()`. Do not use “sign-in” to refer to registration. |
| Signup profile ownership | `registerMember()` creates the Supabase Auth user and supplies `raw_user_meta_data`; the `on_auth_user_created` trigger is the only writer that creates the matching `public.users` row. |
| Member submissions | Any authenticated `member` can submit a thesis. New submissions enter `for_review`. |
| Review authority | Only `admin` and `moderator` can approve/accept, flag, or trash submissions. |
| Moderator naming | `moderator` is the implementation replacement for the older `contributor` role. |
| Member naming | `member` replaces the narrower student-only visitor language because students are not the only audience. |
| Recommendations and lessons | Keep `recommendations` and `lessons_learned` as free-form thesis text fields for MVP. |
| Authors/advisers | Authors and advisers live in `thesis_authors` with required `display_name`, optional `user_id`, and `contribution_role` of `author` or `adviser`. |
| Member editing | Members can edit their own submission only after it has been `flagged`. |
| Flagged revisions | A `flagged` thesis is returned to the submitting member with moderator comments. When the member resubmits, it goes back to `for_review` and editing locks again. |
| Member file attachment | Members can attach/register the thesis PDF or file URL for their own submission. |
| Initial submission packet | The upload page sends metadata and the file together to the authenticated `submitThesis()` server action. Storage happens only after authentication; an RPC failure triggers removal of the newly uploaded storage object. |
| Initial thesis file | PDF only, maximum 10 MiB. Browser and server validate extension, MIME metadata, size, and PDF signature. The Supabase bucket should enforce the same size and MIME restrictions. |
| Thesis dates | The upload form requires `publication_date` and does not collect `year`. The server derives and stores `year` from the publication date for filtering/sorting. The RPC requires both years to match, and the publication date cannot exceed today. Date boundaries use `Asia/Manila`. |
| Trash authority | Both `admin` and `moderator` can trash invalid submissions. |
| Trash recovery | Trashed records are not recoverable through the admin UI for MVP. |
| Approved label | Keep the current DB value `accepted` unless the team chooses a migration; the UI can label it as `Approved`. |
| Submission ownership | Use `theses.submitted_by_user_id uuid REFERENCES public.users(id)` for submission-owner edit/file permissions. Nullable is allowed for legacy/imported rows. Every new ordinary submission—including one performed by an admin—derives the actor from `auth.uid()` and does not accept an ownership override from the client. Confirmed added in live Supabase on 2026-06-27. |
| Primary thesis PDF | Exactly one `thesis_files` row per thesis should be primary for PDF preview/download. |

Detailed moderator-page handoff:
`docs/handoffs/2026-07-08-moderator-review-lifecycle.md`.

## Backend Work Homer Can Start Now

### 1. Service Layer Skeleton

Create the service layer before frontend integration gets messy.

Recommended modules:

```text
Alexandria/lib/supabase/client.ts
Alexandria/lib/supabase/server.ts
Alexandria/lib/services/thesis-service.ts
Alexandria/lib/services/auth-service.ts
Alexandria/lib/services/admin-thesis-service.ts
Alexandria/lib/services/user-service.ts
Alexandria/lib/services/file-service.ts
Alexandria/lib/services/types.ts
Alexandria/lib/services/result.ts
Alexandria/lib/auth/auth-contract.ts
```

`Alexandria/lib/services/types.ts` owns shared service and domain contracts.
`Alexandria/lib/auth/auth-contract.ts` is a compatibility facade that re-exports
the shared auth-facing contracts and keeps only form-specific types locally.
Developers must not redefine shared types in both modules.

Minimum contracts:

- `ThesisService.getAll({ q, year, department, research_area, page, limit })`
- `ThesisService.getById(id)`
- `ThesisService.getFilters()`
- `AuthService.registerMember(payload)`
- `AuthService.getCurrentUser()`
- `AdminThesisService.getAll({ review_status, page, limit })`
- `AdminThesisService.create(payload)`
- `AdminThesisService.update(id, payload)`
- `AdminThesisService.trash(id)`
- `SubmissionService.create(payload)`
- `SubmissionService.updateOwn(id, payload)`
- `UserService.getAll({ role, page, limit })`
- `UserService.updateRole(id, role)`
- `FileService.getAuthenticatedFile(thesisId)`

### 2. Shared Result and Error Shape

Lock this before frontend begins wiring real data.

The executable source of truth is
`Alexandria/lib/services/types.ts`. In particular, use its metadata-capable
`ServiceResult<T>` everywhere rather than declaring an auth-specific variant.

```ts
export type ServiceResult<T> =
  | { data: T; error: null; meta?: PaginationMeta }
  | { data: null; error: ServiceError };

export type ServiceError = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};
```

Important error codes:

- `UNAUTHENTICATED`
- `FORBIDDEN`
- `NOT_FOUND`
- `VALIDATION_FAILED`
- `INVALID_EMAIL_DOMAIN`
- `INVALID_ROLE`
- `FILE_ACCESS_DENIED`
- `FILE_UNAVAILABLE`
- `SUPABASE_ERROR`

### 3. TypeScript Models From SQL

Create frontend-safe types that match the live schema, then separately create UI DTOs.

Raw table-oriented types:

- `DbUser`
- `DbThesis`
- `DbThesisAuthor`
- `DbThesisTag`
- `DbThesisFile`
- `DbThesisConference`
- `DbThesisAudit`

UI/service DTOs:

- `ThesisCard`
- `ThesisDetail`
- `FilterOptions`
- `CurrentUser`
- `AdminThesisRow`
- `UserAdminRow`
- `ValidationErrorList`

This keeps the frontend from being tightly coupled to Supabase row names.

`CurrentUser.usc_id` is `number | null`, and `CurrentUser.created_at` is a
required ISO timestamp string. `RegisterPayload.usc_id` is optional because
students provide an ID while other member affiliations may not have one.

### 4. Auth and Role Guards

Backend-adjacent helpers to start early:

- `requireSession()`
- `requireRole(["admin"])`
- `requireRole(["admin", "moderator"])`
- `isAllowedEmailDomain(email, ["usc.edu.ph"])`
- `assertValidAffiliation(affiliation)`
- `assertValidRole(role)`

Rules to lock:

- Only `admin` manages user roles.
- `moderator` replaces the old Contributor role and can review, accept, flag, and maintain thesis submissions.
- `member` can register, access protected PDFs, and submit theses for review.
- `member` can edit their own submission only after it is `flagged`.
- `affiliation` must not grant system permissions by itself.

### 5. Thesis Acceptance Validation

Create one validation helper used by both admin UI and service/action logic.

Required before acceptance:

- `title`
- at least one author
- at least one adviser name
- `year`
- `department`
- `research_area`
- `abstract`
- at least one tag
- primary PDF file
- `recommendations`
- `lessons_learned`

Output should be field-specific so Ethan can display publish-readiness errors cleanly.

### 6. Public PDF Proxy

The submission flow stores private Supabase object paths. Keep that
provider-specific detail behind the frontend-safe file-access contract.

Recommended behavior:

- Public thesis detail can say whether a file exists.
- Raw `storage_path` and transitional `file_url` values are never returned.
- `GET /api/theses/:id/file` redirects to a short-lived inline URL.
- Guests may preview complete accepted PDFs. Explicit download requires an active account.
- Submitters may preview their own `for_review` or `flagged` PDF; active reviewers may access every review state.
- The route streams or redirects to the Supabase object without placing the raw
  storage URL in thesis DTOs.

Open implementation choice:

- Stream the file through Next.js for stronger URL hiding.
- Stream through Next.js if hiding the storage provider remains important.
- Redirect to the public Supabase object when the simpler MVP behavior is preferred.

### 7. Query Helpers

Start query helpers before UI connects:

- accepted thesis list ordered by `year DESC`
- keyword search across title, abstract, tags, and author profile names
- filters from distinct accepted `department`, `research_area`, and `year`
- thesis detail with authors, tags, conferences, primary file availability
- admin list by `review_status`
- user list by `role`

### 8. Review Lifecycle And Trash

The old plan used archive language, but the product flow is review moderation rather than archival library management. Use clearer moderation language:

- `for_review`
- `flagged`
- `accepted` or user-facing `approved`
- `trashed`

Recommended interpretation:

- `for_review`: submitted and waiting for admin/moderator review.
- `flagged`: needs revision or has missing/incorrect information.
- `accepted`: approved and publicly visible.
- `trashed`: invalid, duplicate, spam, or intentionally removed from active review/public flows.

Backend recommendation:

- Keep the DB value `accepted` if avoiding a migration is preferred, but label it `Approved` in the UI.
- Keep `trashed` in the `review_status` constraint as the MVP trash state.
- Do not overload `flagged` as trash. Flagged should mean fixable.
- Because trashed records are not recoverable in the admin UI for MVP, the UI can hide them entirely unless an audit/debug view is intentionally added later.

### 9. People Schema

The project kept the table name `thesis_authors`, but the table now stores both authors and advisers.

Current model:

- `display_name` is required.
- `user_id` is nullable.
- `contribution_role` is either `author` or `adviser`.
- `sort_order` supports stable author/adviser display.

Schema shape:

```sql
CREATE TABLE public.thesis_authors (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  thesis_id bigint NOT NULL REFERENCES public.theses(id),
  user_id uuid REFERENCES public.users(id),
  display_name text NOT NULL,
  contribution_role text NOT NULL CHECK (contribution_role IN ('author', 'adviser')),
  sort_order integer
);
```

### 10. Schema Follow-Ups

Before frontend wiring, keep these backend/data constraints visible:

- `submitted_by_user_id` exists on `theses` in the live Supabase database and should be used for member-owned edit and file-registration rules.
- `submitted_by_user_id` may be nullable for legacy/imported rows. Every new submission records the authenticated actor from `auth.uid()`; an admin submitting through the normal workflow is therefore the submitter.
- Thesis authorship remains separate in `thesis_authors`: `display_name` is required and `user_id` is optional.
- `review_status = 'trashed'` exists in the live database and is the MVP removal state.
- Add reversible account state to `public.users`: `deactivated_at`, `deactivation_reason`, and `deactivated_by_user_id`.
- Active-account checks must exist in shared service guards, restrictive RLS policies, Storage insert/delete policies, and every authenticated `SECURITY DEFINER` RPC.
- Admin role/status writes should use guarded database functions rather than granting broad browser-driven `UPDATE` access to `public.users`.
- Add or confirm a partial unique index so only one file per thesis can have `is_primary = true`.
- Change `public.users.usc_id` from `NOT NULL` to nullable.
- Update `handle_new_user()` to store a missing USC ID as `NULL`, not the sentinel value `0`.

Recommended USC ID migration:

```sql
ALTER TABLE public.users
ALTER COLUMN usc_id DROP NOT NULL;
```

The signup trigger should use:

```sql
NULLIF(NEW.raw_user_meta_data->>'usc_id', '')::bigint
```

Recommended primary-file uniqueness:

```sql
CREATE UNIQUE INDEX thesis_files_one_primary_per_thesis
ON public.thesis_files (thesis_id)
WHERE is_primary = true;
```

## Immediate 3-Day Backend Plan

### Day 1: Contract Freeze

- Reconcile role names in docs and frontend discussions.
- Confirm review status naming with the team: keep internal `accepted` with UI label `Approved`.
- Confirm service contracts use `submitted_by_user_id` for ownership.
- Confirm service contracts use `review_status = trashed` for MVP removal.
- Confirm file services enforce exactly one primary file per thesis.
- Confirm the updated `thesis_authors` shape is reflected in frontend service types.
- Create shared TypeScript types and result/error shape.

### Day 2: Service Skeleton

- Add Supabase client helper skeletons.
- Add service modules with typed function signatures.
- Add mock implementations or TODO-backed functions that return contract-shaped data.
- Give Leira and Ethan the DTOs they should code against.

### Day 3: Security and Validation Helpers

- Add role guard helpers.
- Add email-domain validation.
- Add thesis acceptance validation.
- Draft PDF proxy route behavior.
- Create a backend QA checklist for auth, accepted-only public visibility, and public PDF proxy access.

## Questions To Lock With The Team

- Should related theses remain frontend-computed, or should Homer prepare a backend query for it early?
