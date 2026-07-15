# Alexandria API Contracts

## 1. Overview

This document defines the data-fetching and API contracts for the Alexandria MVP. These contracts describe the boundary between the frontend application and the data layer.

> **Status:** LOCKED FOR PHASE 1 - Last reviewed: 2026-07-01
>
> Reviewed against `docs/sql/updated_db_fields.sql` and the 2026-06-27 team confirmation that `theses.submitted_by_user_id` has been added in the live Supabase database.

### Architecture Strategy

Alexandria is MVP-scoped with a 1-month delivery window. The following approach balances shipping speed with future scalability:

- **MVP:** All data access is handled through the **Supabase JS client** (`@supabase/supabase-js`) directly from the frontend. No custom REST server is built.
- **Abstraction:** All data calls are wrapped in a **service layer** (`/lib/services/`). UI components call `ThesisService.getAll()` — never `supabase.from(...)` directly. This is the key decoupling mechanism.
- **Scalability path:** When the project grows department- or university-wide, the service implementations can be swapped to point at a dedicated REST or GraphQL backend. Frontend components remain unchanged.

This document defines the **contracts** those service functions must fulfill.

> **Implementation note:** The endpoint names below describe service intent and future backend route shape. For the MVP, frontend pages should call service functions, not fetch these route strings directly unless a route is explicitly implemented.

Current UI routes and future HTTP routes use separate namespaces:

- `/home` — public repository UI.
- `/upload` — authenticated submission UI.
- `/api/theses` — future thesis HTTP resource routes.

### Contract Terms

- **DTO** means "data transfer object." In Alexandria, a DTO is the frontend-safe shape returned by a service function. It hides raw Supabase row details, joins, and sensitive fields.
- DB row names stay close to the live schema, such as `thesis_authors`, `review_status`, and `storage_path`.
- DTO names are frontend-facing, such as `ThesisCard`, `ThesisDetail`, `CurrentUser`, and `file_access`.
- Thesis-related IDs are numbers because the live tables use `bigint` identity columns.
- User IDs are UUID strings because `public.users.id` references `auth.users.id`.

### Canonical Type Ownership

`Alexandria/lib/services/types.ts` is the canonical source for service-layer
contracts, including `UserRole`, `Affiliation`, `ServiceError`,
`ServiceResult`, `CurrentUser`, `RegisterPayload`, `ThesisAuthor`, and
`ThesisAuthorInput`.

`Alexandria/lib/auth/auth-contract.ts` is an auth-facing compatibility facade.
It re-exports shared contracts from `lib/services/types.ts` and owns only
auth-form types such as `LoginInput`, `RegistrationFormInput`, and
`FieldErrors`. Do not redeclare shared service contracts in the auth module.

Import rules:

- Service implementations and non-auth features import shared contracts from
  `@/lib/services/types`.
- Auth components may import the re-exported contracts from
  `@/lib/auth/auth-contract`.
- Contract changes are made in `lib/services/types.ts` first, then reflected in
  this document and the backend function blueprint.
- `ThesisAuthorInput` is derived from `ThesisAuthor`; it excludes the
  database-generated `id` and requires a non-null `sort_order` for writes.

---

## 2. API Patterns & Conventions

### 2.1 Response Format

All service calls resolve to a consistent shape.

**Success:**

```ts
{ data: T, error: null, meta?: { total_count: number, page: number, limit: number } }
```

**Error:**

```ts
{ data: null, error: { code: string, message: string, details?: Record<string, unknown> } }
```

### 2.2 Authentication

- Authenticated operations require a valid Supabase Auth session.
- The Supabase client automatically attaches the JWT for RLS enforcement.
- System role (`admin`, `moderator`, `member`) is stored in `users.role` and enforced by Supabase RLS policies.
- USC identity (`student`, `alumni`, `professor`) is stored in `users.affiliation` — describes who they are at USC, not what they can do.
- Any authenticated `member` can submit a thesis for review.
- Only `admin` and `moderator` users can approve/accept, flag, or trash a submission.
- Members can edit their own submission only after a moderator/admin flags it.
- Members can attach/register their own thesis PDF or file URL.
- The database value `accepted` may be displayed as `Approved` in the UI.
- Member-owned actions are checked against `theses.submitted_by_user_id`.
- `submitted_by_user_id` may be `null` for legacy/imported rows. Every new ordinary submission records its authenticated actor, including submissions performed by an admin.

### 2.3 Pagination

Offset-based using `page` and `limit`.

- Default `page`: `1`
- Default `limit`: `20`

### 2.4 Sort Order

Default sort for public repository browsing: **newest thesis year first** (`year DESC`).

### 2.5 Thesis and Publication Dates

- `publication_date` is required and records the actual publication or
  conference date. It cannot be later than today.
- The upload form does not collect a separate year.
- The server derives `year` from `publication_date` and stores it separately for
  efficient filtering and sorting.
- The database RPC requires `year` to exactly match the calendar year in
  `publication_date`.
- Calendar-date validation uses the `Asia/Manila` date boundary.

---

## 3. Public / Discovery Endpoints

These are accessible without authentication. Full accepted thesis metadata is public.

---

### `GET /api/theses` — List Theses (Browse & Search)

Returns paginated thesis cards for repository browsing and keyword search.

- **Auth Required:** No
- **Query Parameters:**

  | Param           | Type   | Description                                   |
  | --------------- | ------ | --------------------------------------------- |
  | `q`             | string | Search query (title, authors, tags, abstract) |
  | `year`          | int    | Filter by thesis year                         |
  | `department`    | string | Filter by `CS`, `IT`, or `IS`                 |
  | `research_area` | string | Filter by canonical research-area ID          |
  | `page`          | int    | Default `1`                                   |
  | `limit`         | int    | Default `20`                                  |

- **Response:**
  ```json
  {
    "data": [
      {
        "id": 1,
        "title": "Thesis Title",
        "authors": [
          {
            "id": 1,
            "user_id": "uuid-or-null",
            "display_name": "Author One",
            "contribution_role": "author",
            "sort_order": 1
          }
        ],
        "year": 2026,
        "abstract_preview": "First 200 characters of abstract...",
        "tags": ["#react", "#ai"],
        "research_area": "web_development"
      }
    ],
    "meta": { "total_count": 84, "page": 1, "limit": 20 }
  }
  ```

---

### `GET /api/theses/:id` — Thesis Detail

Returns the full detail payload for a single accepted thesis.

- **Auth Required:** No. Both metadata and PDF file access are public.

- **Response:**
  ```json
  {
    "data": {
      "id": 1,
      "title": "Thesis Title",
      "abstract": "Full abstract text...",
      "year": 2026,
      "authors": [
        {
          "id": 1,
          "user_id": "uuid-or-null",
          "display_name": "Author One",
          "contribution_role": "author",
          "sort_order": 1
        },
        {
          "id": 2,
          "user_id": "uuid-or-null",
          "display_name": "Dr. Smith",
          "contribution_role": "adviser",
          "sort_order": 1
        }
      ],
      "department": "CS",
      "research_area": "web_development",
      "tags": ["#react", "#ai", "#progressive-web-apps"],
      "publication_date": "2026-05-14",
      "publication_link": "https://...",
      "conference": "ACM Web Conference 2026",
      "recommendations": "Explore mobile adaptation. Extend the recommendation engine with AI.",
      "lessons_learned": "Start database design early. Do not underestimate PDF storage configuration.",
      "file_access": {
        "has_primary_file": true,
        "preview_path": "/api/theses/1/file",
        "download_path": "/api/theses/1/file?download=1",
        "download_requires_auth": true
      },
      "related_theses": [
        {
          "id": 2,
          "title": "Related Thesis Title",
          "authors": [
            {
              "id": 3,
              "user_id": null,
              "display_name": "Author A",
              "contribution_role": "author",
              "sort_order": 1
            }
          ],
          "year": 2025,
          "abstract_preview": "Short related thesis abstract preview...",
          "tags": ["#react"],
          "research_area": "web_development"
        }
      ]
    }
  }
  ```

> **Note on PDF access:** `thesis_files.storage_path` is never returned directly.
> `GET /api/theses/:id/file` redirects to a short-lived inline URL. Guests may
> preview complete accepted PDFs. `?download=1` requires an active account.

> **Note on `related_theses`:** Populated by the frontend by matching overlapping tags from the current thesis against other accepted records. The backend returns the raw thesis data needed for this computation.

---

### `GET /api/filters` — Filter Options

Returns controlled vocabulary values for filter dropdowns.

- **Auth Required:** No
- **Response:**
  ```json
  {
    "data": {
      "research_areas": [
        "machine_learning",
        "web_development",
        "algorithms"
      ],
      "departments": ["CS", "IT", "IS"],
      "years": [2026, 2025, 2024]
    }
  }
  ```

> **Note:** `research_areas` uses the controlled canonical research-area IDs. Departments use the controlled `CS`, `IT`, and `IS` vocabulary. Neither list is derived from stored rows.

---

## 4. Auth Endpoints

### `POST /api/auth/register` (Future HTTP Equivalent)

Self-registration for members. Restricted to `usc.edu.ph` email addresses. Creates a Supabase Auth user; the `on_auth_user_created` trigger automatically inserts the `users` row.

- **Auth Required:** No
- **Request Body:**
  ```json
  {
    "email": "user@usc.edu.ph",
    "password": "...",
    "profile_name": "Jane Doe",
    "usc_id": 12345678,
    "affiliation": "student"
  }
  ```
- `usc_id` is optional and may be omitted for members without a USC ID.
- **Response:** `201 Created`
- **Errors:** `400 Bad Request` if email domain is not `usc.edu.ph` or `affiliation` is not one of `student`, `alumni`, `professor`.

### `POST /api/auth/login` (Future HTTP Equivalent)

Returns a session for the user.

- **Auth Required:** No
- **Request Body:** `{ "email": "...", "password": "..." }`
- **Response:** `200 OK` with session data (handled by Supabase Auth SDK).

---

## 5. Protected Endpoints

These require an authenticated session. Role checks are enforced by RLS and service-layer guards.

---

### `GET /api/admin/theses` — Review Thesis List

Returns thesis records for the review/admin dashboard.

- **Auth Required:** Yes (Role: `admin` or `moderator`)
- **Parameters:** `page`, `limit`, `review_status` (`for_review` / `flagged` / `accepted` / `trashed`)
- **Response:** Paginated list with `id`, `title`, `review_status`, `year`, `updated_at`.

---

### `submitThesis(FormData)` — Submit Thesis Record

Creates a new thesis record with `review_status = 'for_review'`.

This is currently a Next.js server action, not an HTTP Route Handler. If an HTTP
API is introduced later, its equivalent route is `POST /api/theses`.

- **Auth Required:** Yes (Role: `member`, `admin`, or `moderator`)
- **Ownership:** The database RPC derives the submitting user's id from the
  authenticated Supabase session (`auth.uid()`) and stores it in
  `theses.submitted_by_user_id`. Client payloads cannot choose or override this
  value.
- **Current MVP handoff:** The upload page sends one `FormData` packet to the
  `submitThesis()` server action. The packet contains the thesis metadata as
  serialized JSON under `payload` and the uploaded document under `file`. The
  server authenticates first, uploads the file, and then calls the transactional
  database RPC. If the RPC fails, the server removes the uploaded storage
  object.
- **Derived field:** `year` is not entered by the user. The server derives it
  from the required `publication_date` before calling the database RPC.
- **File requirements:** The packet must contain one PDF no larger than 10 MiB.
  The browser and server validate the `.pdf` extension, MIME metadata, size, and
  `%PDF-` signature. Storage receives the normalized MIME type
  `application/pdf`.
- **Serialized `payload` JSON inside the `FormData` packet:**
  ```json
  {
    "title": "Thesis Title",
    "abstract": "...",
    "department": "CS",
    "research_area": "machine_learning",
    "authors": [
      {
        "user_id": "uuid-or-null",
        "display_name": "Author One",
        "contribution_role": "author",
        "sort_order": 1
      },
      {
        "user_id": null,
        "display_name": "Author Two",
        "contribution_role": "author",
        "sort_order": 2
      },
      {
        "user_id": "uuid-or-null",
        "display_name": "Dr. Adviser",
        "contribution_role": "adviser",
        "sort_order": 1
      }
    "research_area": "machine_learning",
    "authors": [
      {
        "user_id": "uuid-or-null",
        "display_name": "Author One",
        "contribution_role": "author",
        "sort_order": 1
      },
      {
        "user_id": null,
        "display_name": "Author Two",
        "contribution_role": "author",
        "sort_order": 2
      },
      {
        "user_id": "uuid-or-null",
        "display_name": "Dr. Adviser",
        "contribution_role": "adviser",
        "sort_order": 1
      }
    ],
    "tags": ["#react", "#machine-learning"],
    "publication_date": "2026-05-14",
    "publication_link": "https://...",
    "conference": "ACM Web Conference 2026",
    "recommendations": "Explore mobile adaptation. Extend the recommendation engine with AI.",
    "lessons_learned": "Start database design early. Do not underestimate PDF storage configuration.",
    "study_type": "thesis"
  }
  ```

> **Author/adviser storage:** Both `authors` and `advisers` are stored in `thesis_authors`. Use `contribution_role = 'author'` or `contribution_role = 'adviser'` to separate them.

- **Current response:** `ServiceResult<{ id: number }>` from the server action.
- **Future HTTP response:** `201 Created` with the newly created thesis `id`.

---

### `PATCH /api/theses/:id` — Update Thesis (Future HTTP Equivalent)

Updates any field of a `for_review` or `flagged` thesis. Accepts partial payloads.

- **Auth Required:** Yes. `admin` and `moderator` can update review records. `member` can update their own submission only after it is `flagged`.
- **Ownership Check:** Member ownership is determined by `theses.submitted_by_user_id`.
- **Request Body:** Any subset of the POST body above.
- **Response:** `200 OK`

---

### `POST /api/theses/:id/files` — Register File URL (Future HTTP Equivalent)

Called when attaching a file to an existing thesis after initial submission.
Stores the private Supabase object path in `thesis_files.storage_path`.

- **Auth Required:** Yes. `member` may register a file for their own submission. `admin` and `moderator` may register a file for reviewable submissions.
- **Primary File Rule:** A thesis has exactly one current primary file for PDF preview/download. If `is_primary` is `true`, the service must ensure no other file for that thesis remains primary.
- **Request Body:**
  ```json
  {
    "storage_path": "uploads/<user-id>/<upload-id>/thesis.pdf",
    "file_type": "application/pdf",
    "is_primary": true
  }
  ```
- **Response:** `201 Created`

---

### `POST /api/theses/:id/files/replace` — Replace Primary PDF (Future HTTP Equivalent)

Adds a new file URL row and marks it as primary. The old row is retained for history.

- **Auth Required:** Yes (Role: `admin` or `moderator`)
- **Request Body:** Same as file registration above.
- **Response:** `200 OK`

---

### `POST /api/moderator/theses/:id/accept` — Accept Thesis

Validates that all required fields and at least one PDF are present, then sets `review_status = 'accepted'`. Logs action to `thesis_audits`.

- **Auth Required:** Yes (Role: `admin` or `moderator`)
- **Required fields checked before acceptance:**
  - Title, at least one author, at least one adviser, year, department, research area, abstract, at least one tag, primary PDF, recommendations, lessons_learned.
- **Response:** `200 OK`
- **Errors:** `400 Bad Request` with a list of missing fields if validation fails.

**Validation error shape:**

```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Thesis is missing required fields.",
    "details": {
      "missing_fields": ["adviser", "primary_file", "recommendations"]
    }
  }
}
```

---

### `POST /api/moderator/theses/:id/flag` — Flag Thesis

Sets `review_status = 'flagged'`. Optionally records a reason in `thesis_audits`.

- **Auth Required:** Yes (Role: `admin` or `moderator`)
- **Request Body:** `{ "reason": "Missing adviser information." }` (optional)
- **Response:** `200 OK`

---

### `POST /api/admin/theses/:id/trash` — Trash Thesis

Moves a thesis to trashed state. Hidden from all public browsing, search, and active review lists unless explicitly included.

- **Auth Required:** Yes (Role: `admin` or `moderator`)
- **Response:** `200 OK`

> **Note:** Trashed submissions are not recoverable through the admin UI for MVP.

---

### Deferred: Soft Delete

No MVP frontend should call a soft-delete endpoint. The live schema snapshot does not define `theses.deleted_at`, and MVP removal is represented by `review_status = 'trashed'`.

If a future recovery or audit workflow needs soft delete, add `deleted_at` to the schema first and define a new contract at that time.

---

### `getAdminDashboardSnapshot()` — Admin Dashboard Snapshot

Current server service used by `/admin/dashboard`.

- **Auth Required:** Yes (active `admin` or `moderator`)
- **Metrics:** non-trashed research count, active registered-user count, and `for_review` count
- **Activity:** newest five `thesis_audits` rows by `updated_at`
- **Departments:** non-trashed theses grouped by the stored `department`; future departments appear automatically
- **Uploads:** newest five non-trashed theses, with the first ordered author display name

The service returns frontend-safe JSON only. It does not expose raw storage URLs, deactivation reasons, or database credentials.

---

### `GET /api/admin/users` — User List

Returns a paginated, role-filtered account list for unified `/admin/users` tabs.

- **Auth Required:** Yes (Role: `admin`)
- **Parameters:** `page`, `limit`, `role` (`member` / `moderator` / `admin`), `account_status` (`active` / `deactivated`)
- **Administrator behavior:** Administrator rows are listable but read-only; role and account-state mutations remain limited to members and moderators
- **Response:**
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "email": "jane@usc.edu.ph",
        "profile_name": "Jane Doe",
        "usc_id": null,
        "role": "member",
        "affiliation": "alumni",
        "created_at": "2026-07-01T08:00:00.000Z",
        "deactivated_at": null,
        "deactivation_reason": null,
        "deactivated_by_user_id": null
      }
    ],
    "meta": { "total_count": 42, "page": 1, "limit": 20 }
  }
  ```

---

### `PATCH /api/admin/users/:id/role` — Update User Role

Updates a user's system role in `users.role`. Used by the admin role access management view.

- **Auth Required:** Yes (Role: `admin`)
- **Request Body:** `{ "role": "moderator" }`
- **Response:** `200 OK`
- **Allowed transitions:** `member → moderator` and `moderator → member`
- **Errors:** `400 Bad Request` for any other role; `403 Forbidden` for protected administrator targets.

---

### `deactivateUser(userId, reason)` — Deactivate Account

Current server service used by the member and moderator tabs in unified User Management.

- **Auth Required:** Yes (active `admin`)
- **Targets:** `member` or `moderator` only
- **Behavior:** Sets `deactivated_at`, `deactivation_reason`, and `deactivated_by_user_id`
- **Safety:** The acting administrator cannot deactivate themselves; Auth and profile rows are preserved
- **User effect:** Existing sessions are rejected on the next protected request and new login attempts return `ACCOUNT_DEACTIVATED`

---

### `reactivateUser(userId)` — Reactivate Account

- **Auth Required:** Yes (active `admin`)
- **Behavior:** Clears the three current deactivation-state fields
- **Safety:** Does not create a new identity, profile, or role

---

## 6. HTTP Status Code Reference

| Code  | Meaning               | Used When                                         |
| ----- | --------------------- | ------------------------------------------------- |
| `200` | OK                    | Successful GET, PATCH, action endpoint            |
| `201` | Created               | Successful POST that creates a record             |
| `204` | No Content            | Successful DELETE                                 |
| `400` | Bad Request           | Validation failure (e.g., publish missing fields) |
| `401` | Unauthorized          | No valid session token                            |
| `403` | Forbidden             | Valid session but insufficient role               |
| `404` | Not Found             | Record does not exist                             |
| `500` | Internal Server Error | Unexpected backend failure                        |

---

## 7. Frontend DTOs To Implement First

These DTOs should exist in `Alexandria/lib/services/types.ts` before pages start wiring real data.

```ts
export type PaginationMeta = {
  total_count: number;
  page: number;
  limit: number;
};

export type ServiceError = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

export type ServiceResult<T> =
  | { data: T; error: null; meta?: PaginationMeta }
  | { data: null; error: ServiceError };

export type ReviewStatus = "for_review" | "flagged" | "accepted" | "trashed";
export type UserRole = "admin" | "moderator" | "member";
export type Affiliation = "student" | "alumni" | "professor";
export type ContributionRole = "author" | "adviser";
export type StudyType = "thesis" | "capstone";

export type ThesisAuthor = {
  id: number;
  user_id: string | null;
  display_name: string;
  contribution_role: ContributionRole;
  sort_order: number | null;
};

export type ThesisAuthorInput = Omit<
  ThesisAuthor,
  "id" | "sort_order"
> & {
  sort_order: number;
};

export type ThesisCard = {
  id: number;
  title: string;
  authors: ThesisAuthor[];
  year: number;
  abstract_preview: string;
  tags: string[];
  research_area: string | null;
  department: string;
};

export type ThesisDetail = ThesisCard & {
  abstract: string;
  authors: ThesisAuthor[];
  department: string;
  publication_date: string | null;
  publication_link: string | null;
  conference: string | null;
  recommendations: string | null;
  lessons_learned: string | null;
  study_type: StudyType;
  file_access: {
    has_primary_file: boolean;
    preview_path: string | null;
    download_path: string | null;
    download_requires_auth: boolean;
  };
  related_theses: ThesisCard[];
};

export type FilterOptions = {
  research_areas: string[];
  departments: string[];
  years: number[];
};

export type CurrentUser = {
  id: string;
  email: string;
  profile_name: string;
  usc_id: number | null;
  role: UserRole;
  affiliation: Affiliation;
  created_at: string;
};
};
```

## 8. Phase 1 Contract Review Notes

- `submitted_by_user_id` is treated as a locked DB field because the team confirmed it exists in live Supabase on 2026-06-27.
- `submitted_by_user_id` is nullable for legacy/imported rows, but every new ordinary submission records the authenticated actor.
- A thesis has exactly one primary PDF file for preview/download.
- `GET /api/theses/:id/file` provides inline preview according to thesis visibility; `?download=1` requires an active authorized account.
- All public thesis reads filter to `review_status = 'accepted'`.
- Normal admin/review lists exclude `trashed` unless explicitly filtered.
- Frontend status labels display `accepted` as `Approved`.
- Public DTOs never expose `thesis_files.storage_path` or the transitional `file_url`.
- `users.usc_id` is nullable because not every member has a USC ID. The current
  SQL snapshot still marks it `NOT NULL`; the database migration must land
  before live registration relies on omitted IDs.
- Shared contract ownership is centralized in
  `Alexandria/lib/services/types.ts`; auth-layer re-exports must not introduce
  duplicate definitions.

---

## 9. Related Documents

- [Alexandria PRD](./Alexandria%20PRD.md)
- [Database Engineer Reference](./database-engineer-reference.md)
- [Backend Function Headers](./backend_functions.md)
- [Backend Readiness Plan](./backend-readiness-plan.md)
- [Design Decision Log](./design-decision-log.md)
