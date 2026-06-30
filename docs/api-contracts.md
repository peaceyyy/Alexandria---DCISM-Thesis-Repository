# Alexandria API Contracts

## 1. Overview

This document defines the data-fetching and API contracts for the Alexandria MVP. These contracts describe the boundary between the frontend application and the data layer.

> **Status:** LOCKED FOR PHASE 1 - Last reviewed: 2026-06-27
>
> Reviewed against `docs/updated_db_fields.sql` and the 2026-06-27 team confirmation that `theses.submitted_by_user_id` has been added in the live Supabase database.

### Architecture Strategy

Alexandria is MVP-scoped with a 1-month delivery window. The following approach balances shipping speed with future scalability:

- **MVP:** All data access is handled through the **Supabase JS client** (`@supabase/supabase-js`) directly from the frontend. No custom REST server is built.
- **Abstraction:** All data calls are wrapped in a **service layer** (`/lib/services/`). UI components call `ThesisService.getAll()` — never `supabase.from(...)` directly. This is the key decoupling mechanism.
- **Scalability path:** When the project grows department- or university-wide, the service implementations can be swapped to point at a dedicated REST or GraphQL backend. Frontend components remain unchanged.

This document defines the **contracts** those service functions must fulfill.

> **Implementation note:** The endpoint names below describe service intent and future backend route shape. For the MVP, frontend pages should call service functions, not fetch these route strings directly unless a route is explicitly implemented.

### Contract Terms

- **DTO** means "data transfer object." In Alexandria, a DTO is the frontend-safe shape returned by a service function. It hides raw Supabase row details, joins, and sensitive fields.
- DB row names stay close to the live schema, such as `thesis_authors`, `review_status`, and `file_url`.
- DTO names are frontend-facing, such as `ThesisCard`, `ThesisDetail`, `CurrentUser`, and `file_access`.
- Thesis-related IDs are numbers because the live tables use `bigint` identity columns.
- User IDs are UUID strings because `public.users.id` references `auth.users.id`.

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
- `submitted_by_user_id` may be `null` for legacy/imported/admin-uploaded theses. Member self-submissions must set it.

### 2.3 Pagination

Offset-based using `page` and `limit`.

- Default `page`: `1`
- Default `limit`: `20`

### 2.4 Sort Order

Default sort for public repository browsing: **newest thesis year first** (`year DESC`).

---

## 3. Public / Discovery Endpoints

These are accessible without authentication. Full accepted thesis metadata is public.

---

### `GET /theses` — List Theses (Browse & Search)

Returns paginated thesis cards for repository browsing and keyword search.

- **Auth Required:** No
- **Query Parameters:**

  | Param              | Type   | Description                                   |
  | ------------------ | ------ | --------------------------------------------- |
  | `q`                | string | Search query (title, authors, tags, abstract) |
  | `year`             | int    | Filter by thesis year                         |
  | `department`       | string | Filter by department name (e.g. `DCISM`)      |
  | `research_area`    | string | Filter by research area                       |
  | `page`             | int    | Default `1`                                   |
  | `limit`            | int    | Default `20`                                  |

- **Response:**
  ```json
  {
    "data": [
      {
        "id": 1,
        "title": "Thesis Title",
        "authors": [
          { "id": 1, "user_id": "uuid-or-null", "display_name": "Author One", "contribution_role": "author", "sort_order": 1 }
        ],
        "year": 2026,
        "abstract_preview": "First 200 characters of abstract...",
        "tags": ["#react", "#ai"],
        "research_area": "Web Development"
      }
    ],
    "meta": { "total_count": 84, "page": 1, "limit": 20 }
  }
  ```

---

### `GET /theses/:id` — Thesis Detail

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
        { "id": 1, "user_id": "uuid-or-null", "display_name": "Author One", "contribution_role": "author", "sort_order": 1 }
      ],
      "advisers": [
        { "id": 2, "user_id": "uuid-or-null", "display_name": "Dr. Smith", "contribution_role": "adviser", "sort_order": 1 }
      ],
      "department": "DCISM",
      "research_area": "Web Development",
      "tags": ["#react", "#ai", "#progressive-web-apps"],
      "publication_date": "2025-05-14",
      "publication_link": "https://...",
      "conference": "ACM Web Conference 2025",
      "recommendations": "Explore mobile adaptation. Extend the recommendation engine with AI.",
      "lessons_learned": "Start database design early. Do not underestimate PDF storage configuration.",
      "file_access": {
        "has_primary_file": true,
        "requires_auth": false,
        "download_path": "/theses/1/file"
      },
      "related_theses": [
        {
          "id": 2,
          "title": "Related Thesis Title",
          "authors": [
            { "id": 3, "user_id": null, "display_name": "Author A", "contribution_role": "author", "sort_order": 1 }
          ],
          "year": 2025,
          "abstract_preview": "Short related thesis abstract preview...",
          "tags": ["#react"],
          "research_area": "Web Development"
        }
      ]
    }
  }
  ```

> **Note on PDF access:** The `file_url` stored in the database is never returned directly. The backend proxies requests via `GET /theses/:id/file` to stream the PDF from the school server. Authentication is no longer required for this proxy endpoint.

> **Note on `related_theses`:** Populated by the frontend by matching overlapping tags from the current thesis against other accepted records. The backend returns the raw thesis data needed for this computation.

---

### `GET /filters` — Filter Options

Returns controlled vocabulary values for filter dropdowns.

- **Auth Required:** No
- **Response:**
  ```json
  {
    "data": {
      "research_areas": ["Machine Learning", "Web Development", "Information Systems"],
      "departments": ["DCISM", "CAS", "TC"],
      "years": [2026, 2025, 2024]
    }
  }
  ```

> **Note:** `research_areas` and `departments` are derived via `SELECT DISTINCT research_area FROM theses WHERE review_status = 'accepted'` and `SELECT DISTINCT department...` respectively.

---

## 4. Auth Endpoints

### `POST /auth/register`

Self-registration for members. Restricted to `usc.edu.ph` email addresses. Creates a Supabase Auth user; the `on_auth_user_created` trigger automatically inserts the `users` row.

- **Auth Required:** No
- **Request Body:**
  ```json
  { "email": "user@usc.edu.ph", "password": "...", "profile_name": "Jane Doe", "usc_id": 12345678, "affiliation": "student" }
  ```
- **Response:** `201 Created`
- **Errors:** `400 Bad Request` if email domain is not `usc.edu.ph` or `affiliation` is not one of `student`, `alumni`, `professor`.

### `POST /auth/login`

Returns a session for the user.

- **Auth Required:** No
- **Request Body:** `{ "email": "...", "password": "..." }`
- **Response:** `200 OK` with session data (handled by Supabase Auth SDK).

---

## 5. Protected Endpoints

These require an authenticated session. Role checks are enforced by RLS and service-layer guards.

---

### `GET /admin/theses` — Review Thesis List

Returns thesis records for the review/admin dashboard.

- **Auth Required:** Yes (Role: `admin` or `moderator`)
- **Parameters:** `page`, `limit`, `review_status` (`for_review` / `flagged` / `accepted` / `trashed`)
- **Response:** Paginated list with `id`, `title`, `review_status`, `year`, `updated_at`.

---

### `POST /upload/theses` — Submit Thesis Record

Creates a new thesis record with `review_status = 'for_review'`.

- **Auth Required:** Yes (Role: `member`, `admin`, or `moderator`)
- **Ownership:** The service stores the submitting user's id in `theses.submitted_by_user_id`.
- **Request Body:**
  ```json
  {
    "title": "Thesis Title",
    "abstract": "...",
    "year": 2026,
    "department": "DCISM",
    "research_area": "Machine Learning",
    "authors": [
      { "user_id": "uuid-or-null", "display_name": "Author One", "sort_order": 1 },
      { "user_id": null, "display_name": "Author Two", "sort_order": 2 }
    ],
    "advisers": [
      { "user_id": "uuid-or-null", "display_name": "Dr. Adviser", "sort_order": 1 }
    ],
    "tags": ["#react", "#machine-learning"],
    "publication_date": "2025-05-14",
    "publication_link": "https://...",
    "conference": "ACM Web Conference 2025",
    "recommendations": "Explore mobile adaptation. Extend the recommendation engine with AI.",
    "lessons_learned": "Start database design early. Do not underestimate PDF storage configuration."
  }
  ```

> **Author/adviser storage:** Both `authors` and `advisers` are stored in `thesis_authors`. Use `contribution_role = 'author'` or `contribution_role = 'adviser'` to separate them.
- **Response:** `201 Created` - returns the newly created thesis `id`.

---

### `PATCH /upload/theses/:id` — Update Thesis

Updates any field of a `for_review` or `flagged` thesis. Accepts partial payloads.

- **Auth Required:** Yes. `admin` and `moderator` can update review records. `member` can update their own submission only after it is `flagged`.
- **Ownership Check:** Member ownership is determined by `theses.submitted_by_user_id`.
- **Request Body:** Any subset of the POST body above.
- **Response:** `200 OK`

---

### `POST /upload/theses/:id/files` — Register File URL

Called after the PDF has been placed on the school server. Stores the URL pointer in `thesis_files`.

- **Auth Required:** Yes. `member` may register a file for their own submission. `admin` and `moderator` may register a file for reviewable submissions.
- **Primary File Rule:** A thesis has exactly one current primary file for PDF preview/download. If `is_primary` is `true`, the service must ensure no other file for that thesis remains primary.
- **Request Body:**
  ```json
  {
    "file_url": "https://dcism.usc.edu.ph/repository/thesis_final.pdf",
    "file_type": "application/pdf",
    "is_primary": true
  }
  ```
- **Response:** `201 Created`

---

### `POST /upload/theses/:id/files/replace` — Replace Primary PDF

Adds a new file URL row and marks it as primary. The old row is retained for history.

- **Auth Required:** Yes (Role: `admin` or `moderator`)
- **Request Body:** Same as file registration above.
- **Response:** `200 OK`

---

### `POST /moderator/theses/:id/accept` — Accept Thesis

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

### `POST /moderator/theses/:id/flag` — Flag Thesis

Sets `review_status = 'flagged'`. Optionally records a reason in `thesis_audits`.

- **Auth Required:** Yes (Role: `admin` or `moderator`)
- **Request Body:** `{ "reason": "Missing adviser information." }` (optional)
- **Response:** `200 OK`

---

### `POST /admin/theses/:id/trash` — Trash Thesis

Moves a thesis to trashed state. Hidden from all public browsing, search, and active review lists unless explicitly included.

- **Auth Required:** Yes (Role: `admin` or `moderator`)
- **Response:** `200 OK`

> **Note:** Trashed submissions are not recoverable through the admin UI for MVP.

---

### Deferred: Soft Delete

No MVP frontend should call a soft-delete endpoint. The live schema snapshot does not define `theses.deleted_at`, and MVP removal is represented by `review_status = 'trashed'`.

If a future recovery or audit workflow needs soft delete, add `deleted_at` to the schema first and define a new contract at that time.

---

### `GET /admin/users` — User List

Returns a paginated list of all users with their role and affiliation. Used by the admin users management view.

- **Auth Required:** Yes (Role: `admin`)
- **Parameters:** `page`, `limit`, `role` (`admin` / `moderator` / `member`)
- **Response:**
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "email": "jane@usc.edu.ph",
        "profile_name": "Jane Doe",
        "usc_id": 12345678,
        "role": "member",
        "affiliation": "student"
      }
    ],
    "meta": { "total_count": 42, "page": 1, "limit": 20 }
  }
  ```

---

### `PATCH /admin/users/:id/role` — Update User Role

Updates a user's system role in `users.role`. Used by the admin role access management view.

- **Auth Required:** Yes (Role: `admin`)
- **Request Body:** `{ "role": "moderator" }`
- **Response:** `200 OK`
- **Errors:** `400 Bad Request` if `role` is not one of `admin`, `moderator`, `member`.

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

export type ThesisPerson = {
  id: number;
  user_id: string | null;
  display_name: string;
  contribution_role: ContributionRole;
  sort_order: number | null;
};

export type ThesisCard = {
  id: number;
  title: string;
  authors: ThesisPerson[];
  year: number;
  abstract_preview: string;
  tags: string[];
  research_area: string | null;
};

export type ThesisDetail = ThesisCard & {
  abstract: string;
  advisers: ThesisPerson[];
  department: string;
  publication_date: string | null;
  publication_link: string | null;
  conference: string | null;
  recommendations: string | null;
  lessons_learned: string | null;
  file_access: {
    has_primary_file: boolean;
    requires_auth: boolean;
    download_path: string | null;
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
  usc_id: number;
  role: UserRole;
  affiliation: Affiliation;
};

export type AdminThesisRow = {
  id: number;
  title: string;
  review_status: ReviewStatus;
  year: number;
  updated_at: string;
  submitted_by_user_id: string | null;
};

export type UserAdminRow = CurrentUser;

export type ValidationErrorList = {
  missing_fields: string[];
};
```

## 8. Phase 1 Contract Review Notes

- `submitted_by_user_id` is treated as a locked DB field because the team confirmed it exists in live Supabase on 2026-06-27.
- `submitted_by_user_id` is nullable for legacy/imported/admin-uploaded theses, but required for member self-submissions.
- A thesis has exactly one primary PDF file for preview/download.
- `GET /theses/:id/file` may stream or redirect after auth. The frontend contract is only `file_access.download_path`.
- All public thesis reads filter to `review_status = 'accepted'`.
- Normal admin/review lists exclude `trashed` unless explicitly filtered.
- Frontend status labels display `accepted` as `Approved`.
- Public DTOs never expose raw `thesis_files.file_url`.

---

## 9. Related Documents

- [Alexandria PRD](./Alexandria%20PRD.md)
- [Database Engineer Reference](./database-engineer-reference.md)
- [Design Decision Log](./design-decision-log.md)
