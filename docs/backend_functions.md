# Alexandria — Backend Function Headers Blueprint

> **Status:** Draft · Phase 1 Skeleton
> Last updated: 2026-07-01
>
> This document is the **function-level blueprint** for the Alexandria service layer (`Alexandria/lib/services/`).
> Function bodies are intentionally left empty (`TODO`). This file is the single source of truth for
> what the frontend pages will call — not raw Supabase queries.
>
> Source contracts: [`api-contracts.md`](./api-contracts.md) · [`backend-readiness-plan.md`](./backend-readiness-plan.md)

---

## File Map

```
Alexandria/lib/
├── supabase/
│   ├── client.ts              ← browser-side Supabase client
│   └── server.ts              ← server-side Supabase client (Next.js RSC / Route Handlers)
└── services/
    ├── types.ts               ← all DTOs, DB row types, and shared enums
    ├── result.ts              ← ServiceResult<T> helper / error constructors
    ├── thesis-service.ts      ← public browsing & search
    ├── auth-service.ts        ← registration, login, session, current user
    ├── submission-service.ts  ← member thesis submission & member-owned updates
    ├── admin-thesis-service.ts← admin/moderator review actions
    ├── file-service.ts        ← public PDF proxy / file registration
    └── user-service.ts        ← admin user management
```

---

## 1. `types.ts` — Shared Types & DTOs

> All types should be declared in `Alexandria/lib/services/types.ts`.
> These are the shapes every service function returns or accepts.
>
> `Alexandria/lib/auth/auth-contract.ts` may re-export these shared contracts
> for auth-facing consumers, but it must not redefine them. Auth form-only
> types remain local to that compatibility facade. See
> [`api-contracts.md`](./api-contracts.md#canonical-type-ownership).

```ts
// ─── Primitives ──────────────────────────────────────────────────────────────
export type ReviewStatus = "for_review" | "flagged" | "accepted" | "trashed";
export type UserRole = "admin" | "moderator" | "member";
export type Affiliation = "student" | "alumni" | "professor";
export type ContributionRole = "author" | "adviser";
// ─── Pagination & Result Envelope ────────────────────────────────────────────
export type PaginationMeta = {
  total_count: number;
  page: number;
  limit: number;
};
export type ServiceError = {
  code: string; // e.g. "VALIDATION_FAILED", "FORBIDDEN"
  message: string;
  details?: Record<string, unknown>;
};
export type ServiceResult<T> =
  | { data: T; error: null; meta?: PaginationMeta }
  | { data: null; error: ServiceError };
// ─── Raw DB Row Types (never returned to UI directly) ────────────────────────
export type DbUser = {
  id: string; // uuid — mirrors auth.users.id
  email: string;
  profile_name: string;
  usc_id: number | null;
  role: UserRole;
  affiliation: Affiliation;
  created_at: string;
};
export type DbThesis = {
  id: number; // bigint identity
  title: string;
  abstract: string | null;
  year: number;
  department: string;
  research_area: string | null;
  review_status: ReviewStatus;
  publication_date: string | null;
  publication_link: string | null;
  conference: string | null;
  recommendations: string | null;
  lessons_learned: string | null;
  submitted_by_user_id: string | null; // uuid — nullable for legacy/admin uploads
  created_at: string;
  updated_at: string;
};
export type DbThesisAuthor = {
  id: number;
  thesis_id: number;
  user_id: string | null; // uuid — nullable for external/non-registered authors
  display_name: string;
  contribution_role: ContributionRole;
  sort_order: number | null;
};
export type DbThesisTag = {
  id: number;
  thesis_id: number;
  tag: string;
};
export type DbThesisFile = {
  id: number;
  thesis_id: number;
  file_url: string; // NEVER returned to public payloads
  is_primary: boolean;
  created_at: string;
};
export type DbThesisAudit = {
  id: number;
  thesis_id: number;
  changed_by_user_id: string;
  change_description: string;
  created_at: string;
};
// ─── UI / Service DTOs (frontend-safe shapes) ────────────────────────────────
export type ThesisAuthor = {
  id: number;
  user_id: string | null;
  display_name: string;
  contribution_role: ContributionRole;
  sort_order: number | null;
};
/** Used on the Browse/Search page and as embedded related-thesis cards. */
export type ThesisCard = {
  id: number;
  title: string;
  authors: ThesisAuthor[];
  year: number;
  abstract_preview: string; // first ~200 chars of abstract
  tags: string[];
  research_area: string | null;
};
/** Used on the Thesis Detail page. Extends ThesisCard. */
export type ThesisDetail = ThesisCard & {
  abstract: string;
  authors: ThesisAuthor[];
  department: string;
  publication_date: string | null;
  publication_link: string | null;
  conference: string | null;
  recommendations: string | null;
  lessons_learned: string | null;
  file_access: {
    has_primary_file: boolean;
    requires_auth: boolean;
    download_path: string | null; // e.g. "/api/theses/1/file" — never a raw URL
  };
  related_theses: ThesisCard[]; // frontend-computed from tag overlap
};
/** Dropdowns for year/department/research_area filters on the Browse page. */
export type FilterOptions = {
  research_areas: string[];
  departments: string[];
  years: number[];
};
/** Returned after successful login / getCurrentUser(). */
export type CurrentUser = {
  id: string;
  email: string;
  profile_name: string;
  usc_id: number | null;
  role: UserRole;
  affiliation: Affiliation;
  created_at: string;
};
/** Row shape for the admin review dashboard list. */
export type AdminThesisRow = {
  id: number;
  title: string;
  review_status: ReviewStatus;
  year: number;
  updated_at: string;
  submitted_by_user_id: string | null;
};
/** Row shape for the admin user management list. Alias of CurrentUser. */
export type UserAdminRow = CurrentUser;
/** Returned inside a VALIDATION_FAILED ServiceError's details. */
export type ValidationErrorList = {
  missing_fields: string[];
};
// ─── Request Payload Types ────────────────────────────────────────────────────
export type RegisterPayload = {
  email: string;
  password: string;
  profile_name: string;
  usc_id?: number;
  affiliation: Affiliation;
};
export type ThesisAuthorInput = Omit<
  ThesisAuthor,
  "id" | "sort_order"
> & {
  sort_order: number;
};
export type SubmitThesisPayload = {
  title: string;
  abstract: string;
  /** Derived by the server from publication_date. */
  year: number;
  department: string;
  research_area: string;
  authors: ThesisAuthorInput[];
  tags: string[];
  /** Added by the server after storage upload; never accepted from the browser. */
  file_url: string;
  file_type: "application/pdf";
  /** Required YYYY-MM-DD; cannot exceed today. */
  publication_date: string;
  publication_link?: string;
  conference?: string;
  recommendations?: string;
  lessons_learned?: string;
};
export type SubmitThesisInput = Omit<
  SubmitThesisPayload,
  "file_url" | "file_type" | "year"
>;
/** All fields optional — partial PATCH. */
export type updateThesisStatusPayload = Partial<SubmitThesisPayload>;
export type RegisterFilePayload = {
  file_url: string;
  file_type?: string;
  is_primary: boolean;
};
export type ThesisListParams = {
  q?: string;
  year?: number;
  department?: string;
  research_area?: string;
  page?: number; // default 1
  limit?: number; // default 20
};
export type AdminThesisListParams = {
  review_status?: ReviewStatus;
  page?: number;
  limit?: number;
};
export type UserListParams = {
  role?: UserRole;
  page?: number;
  limit?: number;
};
```

---

## 2. `result.ts` — ServiceResult Helpers

> Utility constructors that every service file imports.

```ts
import type { ServiceError, ServiceResult, PaginationMeta } from "./types";
/** Wrap a successful value in the standard envelope. */
export function ok<T>(data: T, meta?: PaginationMeta): ServiceResult<T>;
/** Wrap a known ServiceError. */
export function err<T>(error: ServiceError): ServiceResult<T>;
/** Construct a typed ServiceError literal. */
export function makeError(
  code: string,
  message: string,
  details?: Record<string, unknown>,
): ServiceError;
```

---

## 3. `thesis-service.ts` — Public Browsing & Search

> **Used by:** Home/Browse page, Search results, Thesis Detail page.
> **Auth required:** None for these functions.

```ts
import type {
  ThesisCard,
  ThesisDetail,
  FilterOptions,
  ThesisListParams,
  ServiceResult,
} from "./types";
/**
 * Future HTTP equivalent: GET /api/theses
 * Returns a paginated, filtered list of accepted thesis cards.
 * Default sort: year DESC.
 * Used by: Browse/Search page.
 */
export async function getTheses(
  params?: ThesisListParams,
): Promise<ServiceResult<ThesisCard[]>>;
/**
 * Future HTTP equivalent: GET /api/theses/:id
 * Returns the full detail payload for a single accepted thesis.
 * Includes authors, tags, file_access, and related_theses.
 * Used by: Thesis Detail page.
 */
export async function getThesisById(
  id: number,
): Promise<ServiceResult<ThesisDetail>>;
/**
 * Future HTTP equivalent: GET /api/filters
 * Returns distinct accepted values for year, department, and research_area.
 * Used by: Browse page filter dropdowns.
 */
export async function getFilterOptions(): Promise<ServiceResult<FilterOptions>>;
```

---

## 4. `auth-service.ts` — Authentication & Session

> **Used by:** Sign-up page (registration), Login page (existing-account authentication), and all protected layouts (session check).

```ts
import type { CurrentUser, RegisterPayload, ServiceResult } from "./types";
/**
 * Current server service: registerMember()
 * Future HTTP equivalent: POST /api/auth/register
 * Creates a Supabase Auth user and supplies profile metadata.
 * The on_auth_user_created database trigger owns the public.users insert.
 * Validates that email domain is "usc.edu.ph" and affiliation is valid.
 * Used by: Sign-up page.
 */
export async function registerMember(
  payload: RegisterPayload,
): Promise<ServiceResult<{ id: string }>>;
/**
 * Current server service: login()
 * Future HTTP equivalent: POST /api/auth/login
 * Signs in with email and password via Supabase Auth.
 * Returns the active session (handled internally by Supabase SDK).
 * Used by: Login page.
 */
export async function login(
  email: string,
  password: string,
): Promise<ServiceResult<CurrentUser>>;
/**
 * Current server service: logout()
 * Future HTTP equivalent: POST /api/auth/logout
 * Signs the current user out and invalidates the Supabase session.
 * Used by: Navigation / user menu.
 */
export async function logout(): Promise<ServiceResult<null>>;
/**
 * (No route — reads active Supabase session)
 * Returns the currently authenticated user's profile from public.users.
 * Returns null in data if no active session.
 * Used by: All protected layouts, navigation auth state, role guards.
 */
export async function getCurrentUser(): Promise<
  ServiceResult<CurrentUser | null>
>;
// ─── Domain Validation Helpers ────────────────────────────────────────────────
/**
 * Returns true if the email ends with one of the allowed domains.
 * Used by: registerMember() guard, registration form pre-validation.
 */
export function isAllowedEmailDomain(
  email: string,
  allowedDomains: string[], // e.g. ["usc.edu.ph"]
): boolean;
/**
 * Returns true if role is "admin" | "moderator" | "member", false otherwise.
 * Used by: updateUserRole() guard.
 */
export function assertValidRole(
  role: string,
): role is "admin" | "moderator" | "member";
```

---

## 5. `submission-service.ts` — Member Thesis Submission

> **Used by:** Submit Thesis page, member's own submission edit form.
> **Auth required:** Yes — any authenticated `member`, `moderator`, or `admin`.

```ts
import type {
  SubmitThesisPayload,
  updateThesisStatusPayload,
  RegisterFilePayload,
  ServiceResult,
} from "./types";
/**
 * Current server service: getOwnSubmissions()
 * Future HTTP equivalent: GET /api/theses/me
 * Returns a list of all theses submitted by the current user.
 * This allows members to see their own pending (`for_review`), `flagged`, or `accepted` submissions,
 * which do not appear in the public catalog until accepted.
 * Used by: "My Submissions" page or dashboard.
 */
export async function getOwnSubmissions(): Promise<ServiceResult<ThesisDetail[]>>;
/**
 * Current server action: submitThesis(FormData)
 * Future HTTP equivalent: POST /api/theses
 * Creates a new thesis record with review_status = 'for_review'.
 * The database RPC derives submitted_by_user_id from auth.uid().
 * Client payloads cannot choose or override submission ownership.
 * Accepts one FormData packet containing serialized metadata and the file.
 * Accepts PDF only, with a maximum file size of 10 MiB.
 * Uploads on the server and removes the storage object if the RPC fails.
 * Inserts authors and/or advisers into thesis_authors.
 * Used by: Submit Thesis page.
 */
export async function submitThesis(
  submissionPacket: FormData,
): Promise<ServiceResult<{ id: number }>>;
/**
 * Future HTTP equivalent: PATCH /api/theses/:id
 * Updates an existing thesis owned by the current user.
 * Members may only update their own submission when review_status = 'flagged'.
 * Ownership is checked against theses.submitted_by_user_id.
 * Accepts partial payloads.
 * Used by: Member edit-after-flag flow.
 */
export async function updateOwnSubmission(
  id: number,
  payload: updateThesisStatusPayload,
): Promise<ServiceResult<null>>;
/**
 * Future HTTP equivalent: POST /api/theses/:id/files
 * Registers a PDF file URL for a thesis the member owns.
 * If is_primary = true, clears the primary flag on any existing primary file.
 * Used by: Future file attachment flow for an existing thesis.
 */
export async function registerThesisFile(
  thesisId: number,
  payload: RegisterFilePayload,
): Promise<ServiceResult<null>>;
```

---

## 6. `admin-thesis-service.ts` — Admin / Moderator Review

> **Used by:** Admin review dashboard, moderator review queue.
> **Auth required:** Yes — `admin` or `moderator` only.

```ts
import type {
  AdminThesisRow,
  AdminThesisListParams,
  SubmitThesisPayload,
  updateThesisStatusPayload,
  RegisterFilePayload,
  ServiceResult,
} from "./types";
/**
 * Future HTTP equivalent: GET /api/admin/theses
 * Returns paginated thesis records for the review dashboard.
 * Supports filtering by review_status (for_review | flagged | accepted | trashed).
 * Excludes trashed by default unless review_status = 'trashed' is passed.
 * Used by: Admin review dashboard.
 */
export async function getAdminTheses(
  params?: AdminThesisListParams,
): Promise<ServiceResult<AdminThesisRow[]>>;
/**
 * Future HTTP equivalent: POST /api/admin/theses
 * Admin/moderator creates a new thesis on behalf of a member or for import.
 * submitted_by_user_id may be null for admin-uploaded/imported theses.
 * Used by: Admin thesis import / manual upload.
 */
export async function createThesis(
  payload: SubmitThesisPayload,
): Promise<ServiceResult<{ id: number }>>;
/**
 * Future HTTP equivalent: PATCH /api/admin/theses/:id
 * Updates any field of a thesis, including changing review_status to 'accepted' or 'flagged'.
 * No ownership restriction — admin and moderator can edit any reviewable record.
 * If updating review_status to 'accepted', this function MUST validate that all
 * required fields are present (title, authors, year, pdf, etc.) before saving.
 * Used by: Admin review detail / edit panel (for editing, approving, and flagging).
 */
export async function updateThesisStatus(
  id: number,
  payload: updateThesisStatusPayload,
): Promise<ServiceResult<null>>;
/**
 * Future HTTP equivalent: POST /api/admin/theses/:id/trash
 * Sets review_status = 'trashed'. Hides the thesis from all public and review views.
 * Not recoverable through the admin UI for MVP.
 * Logs the action to thesis_audits.
 * Used by: Admin review dashboard — "Trash" action.
 */
export async function trashThesis(id: number): Promise<ServiceResult<null>>;
/**
 * Future HTTP equivalent: POST /api/theses/:id/files/replace
 * Adds a new primary file URL and marks the old one as non-primary.
 * Old file row is retained for audit history.
 * Used by: Admin file replacement panel.
 */
export async function replacePrimaryFile(
  thesisId: number,
  payload: RegisterFilePayload,
): Promise<ServiceResult<null>>;
// ─── Acceptance Validation Helper ─────────────────────────────────────────────
/**
 * Validates that a thesis record has all required fields for acceptance.
 * Returns a ValidationErrorList with missing_fields if incomplete.
 * Pure function — no DB calls. Called before acceptThesis() in the service
 * and also usable by the admin UI to preview readiness.
 * Required: title, >=1 author, >=1 adviser, year, department, research_area,
 *           abstract, >=1 tag, primary PDF, recommendations, lessons_learned.
 */
export function validateThesisForAcceptance(thesis: {
  title: string | null;
  abstract: string | null;
  year: number | null;
  department: string | null;
  research_area: string | null;
  conference: string | null;
  recommendations: string | null;
  lessons_learned: string | null;
  authors: { contribution_role: string }[];
  tags: string[];
  has_primary_file: boolean;
}): { valid: boolean; missing_fields: string[] };
```

---

## 7. `file-service.ts` — Public PDF Access

> **Used by:** Thesis Detail page (PDF viewer / download button).
> **Auth required:** No for access (per Decision 041). Public payload only exposes `download_path`.

```ts
import type { ServiceResult } from "./types";
/**
 * Future HTTP equivalent: GET /api/theses/:id/file
 * Returns the public URL or stream path for the thesis PDF.
 * No longer requires a Supabase session (per Decision 041).
 * Checks the thesis is accepted.
 * Never exposes the raw thesis_files.file_url to the caller.
 *
 * Implementation options (to be decided):
 *   (a) Return a short-lived signed/proxy URL.
 *   (b) Stream the file through a Next.js Route Handler.
 *   (c) Redirect to the public Supabase Storage object.
 *
 * Used by: Thesis Detail page PDF viewer / download button.
 */
export async function getPublicFileUrl(
  thesisId: number,
): Promise<ServiceResult<{ url: string }>>;
```

---

## 8. `user-service.ts` — Admin User Management

> **Used by:** Admin Users Management page.
> **Auth required:** Yes — `admin` only.

```ts
import type {
  UserAdminRow,
  UserListParams,
  UserRole,
  ServiceResult,
} from "./types";
/**
 * Future HTTP equivalent: GET /api/admin/users
 * Returns a paginated list of all users with role and affiliation.
 * Supports filtering by role.
 * Used by: Admin Users Management page.
 */
export async function getUsers(
  params?: UserListParams,
): Promise<ServiceResult<UserAdminRow[]>>;
/**
 * Future HTTP equivalent: PATCH /api/admin/users/:id/role
 * Updates a user's system role (admin | moderator | member).
 * Only admin may call this.
 * Used by: Admin Users Management page — role dropdown.
 */
export async function updateUserRole(
  userId: string,
  role: UserRole,
): Promise<ServiceResult<null>>;
```

---

## 9. Role & Session Guard Helpers

> Shared guards for use inside any service function before DB operations.
> Suggested location: `Alexandria/lib/services/_guards.ts`

```ts
import type { CurrentUser, UserRole } from "./types";
/**
 * Resolves the current Supabase session and returns the CurrentUser profile.
 * Returns a FORBIDDEN ServiceError if there is no active session.
 * Call at the top of any protected service function.
 */
export async function requireSession(): Promise<CurrentUser>;
/**
 * Resolves the current user and asserts their role is in allowedRoles.
 * Returns a FORBIDDEN ServiceError if the role check fails.
 * Call after requireSession() in admin/moderator-only functions.
 */
export async function requireRole(
  allowedRoles: UserRole[],
): Promise<CurrentUser>;
/**
 * Asserts that the current user is the owner of a given thesis.
 * Ownership is checked against theses.submitted_by_user_id.
 * Returns a FORBIDDEN ServiceError if the user is not the owner.
 * Used to gate member edit and file-registration flows.
 */
export async function requireOwnership(
  thesisId: number,
  currentUserId: string,
): Promise<void>;
```

---

## 10. Page → Service Function Map

> Quick reference: which page calls which service functions.
> | Page | Service Functions Called |
> |------|--------------------------|
> | **Home / Browse (`/home`)** | `getTheses()`, `getFilterOptions()` |
> | **Search Results** | `getTheses({ q, year, department, research_area })` |
> | **Thesis Detail** | `getThesisById(id)`, `getPublicFileUrl(id)` |
> | **Login** | `login()` |
> | **Sign-up (Registration)** | `registerMember()` |
> | **Submit Thesis (`/upload`)** | `submitThesis()` |
> | **My Submission (member edit)** | `updateOwnSubmission()`, `registerThesisFile()` |
> | **Admin Review Queue** | `getAdminTheses()`, `acceptThesis()`, `flagThesis()`, `trashThesis()` |
> | **Admin Thesis Detail / Edit** | `updateThesisStatus()`, `replacePrimaryFile()`, `validateThesisForAcceptance()` |
> | **Admin Create / Import Thesis** | `createThesis()` |
> | **Admin Users Management** | `getUsers()`, `updateUserRole()` |

## | **Nav / Session State** | `getCurrentUser()`, `logout()` |

## 11. Error Code Reference

| Code                   | When It Is Thrown                                           |
| ---------------------- | ----------------------------------------------------------- |
| `UNAUTHENTICATED`      | No valid Supabase session on a protected call               |
| `FORBIDDEN`            | Valid session but insufficient role or not the thesis owner |
| `NOT_FOUND`            | Thesis or user record does not exist                        |
| `VALIDATION_FAILED`    | Thesis missing required fields before acceptance            |
| `INVALID_EMAIL_DOMAIN` | Registration email is not `@usc.edu.ph`                     |
| `INVALID_ROLE`         | Role value outside `admin`, `moderator`, `member`           |
| `FILE_ACCESS_DENIED`   | Request to unaccepted/unavailable PDF endpoint              |
| `FILE_UNAVAILABLE`     | No primary file recorded for the thesis                     |
| `SUPABASE_ERROR`       | Raw Supabase/PostgREST error passthrough                    |

---

## Related Documents

- [API Contracts](./api-contracts.md)
- [Backend Readiness Plan](./backend-readiness-plan.md)
- [Database Engineer Reference](./database-engineer-reference.md)
- [Design System (DESIGN.md)](./DESIGN.md)
