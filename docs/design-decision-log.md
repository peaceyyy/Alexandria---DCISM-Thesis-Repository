# Alexandria Design Decision Log

This log records accepted product, database, backend, and access-control decisions for the Alexandria MVP. Use it as the source of traceability when updating the PRD, database schema, backend API, and frontend flows.

## 2026-06-24

### Decision 001: Use Supabase/PostgreSQL as the MVP database platform

Status: Accepted

Context: Alexandria needs a database for thesis metadata, tags, advisers, research areas, admin records, and search/filter behavior.

Decision: Use Supabase/PostgreSQL as the MVP database platform.

Consequences:

- Database work should target PostgreSQL.
- Schema design should include foreign keys, indexes, migrations, and Row Level Security.
- Backend implementation should assume Supabase project configuration is required.
- The database engineer should draft the schema against Supabase/PostgreSQL rather than SQLite or a generic local-only database.

### Decision 002: Use Supabase Auth for authentication

Status: Accepted

Context: The project needs authenticated PDF access and admin-only management workflows.

Decision: Use Supabase Auth as the hosted authentication provider.

Consequences:

- Identity should come from Supabase `auth.users`.
- App-specific display and role fields should live in a `profiles` table.
- Admin/Contributor permissions should be checked through backend logic and database policies.
- Backend-owned password storage is out of scope for the MVP.

### Decision 003: Use Supabase Storage for PDF files

Status: Accepted

Context: Alexandria needs to store and serve thesis PDFs for preview and download.

Decision: Store uploaded PDFs in Supabase Storage/object storage. Store object metadata and references in the database.

Consequences:

- The database should store file metadata in `thesis_files`.
- The actual PDF should not be stored directly inside the main thesis table.
- The storage bucket access mode follows the latest PDF-access decision.
- External PDF/repository links remain a fallback only if object storage becomes impractical.

### Decision 004: Require authentication for PDF preview and download

Status: Superseded by Decision 041

Context: The repository should expose thesis metadata for discovery while controlling access to thesis documents.

Decision: Both PDF preview and PDF download require authentication.

Consequences:

- Anonymous users may browse/search published thesis metadata.
- Anonymous users must not preview or download PDFs.
- The frontend needs login-aware PDF preview/download states.
- The backend/storage layer should use authenticated reads or signed URLs.

### Decision 005: Use draft then publish for admin-created records

Status: Accepted

Context: Admin-created thesis records may be incomplete while metadata, PDF files, tags, and knowledge-transfer entries are being prepared.

Decision: New admin-created thesis records start as `draft`, then are manually published.

Consequences:

- Public repository views should only show `published` records.
- Draft records should be visible/editable to authorized Admin/Contributor users.
- A publish action should validate required metadata and file presence.
- The thesis table should include a publication status such as `draft`, `published`, and `archived`.

### Decision 006: Upload PDF and manually enter metadata

Status: Accepted

Context: The team does not plan to depend on automated PDF metadata extraction for the MVP.

Decision: Admins upload the PDF and manually enter required metadata.

Consequences:

- The admin UI should include PDF upload and metadata form fields.
- The backend should not assume metadata can be extracted from the PDF.
- Required fields must be validated before publishing.
- Future OCR or extraction features remain out of scope.

### Decision 007: Store author names only

Status: Accepted

Context: The MVP only needs thesis author display and author-name search. Author contact management is unnecessary.

Decision: Store ordered author names per thesis. Do not create reusable author profiles or collect author email/contact fields for MVP.

Consequences:

- The database can use `thesis_authors` with `thesis_id`, `author_name`, and `author_order`.
- The MVP should not include an `authors` profile table.
- Author search should search `thesis_authors.author_name`.
- If future author profiles become necessary, a later migration can normalize authors.

### Decision 008: Store recommendations and lessons as multiple ordered entries

Status: Accepted

Context: Recommendations and lessons learned are core knowledge-transfer features. They need to be readable and editable as separate points.

Decision: Store each recommendation and lesson learned as its own ordered row.

Consequences:

- Use `recommendations` and `lessons_learned` columns directly on the `theses` table.
- Each row should include content and sort order.
- The frontend should display these as ordered or bullet-style lists.
- One large freeform text field is not the MVP model.

### Decision 009: Compute related theses dynamically

Status: Accepted

Context: Related thesis discovery is required, but AI-powered recommendations and manual override tooling are excluded from the MVP.

Decision: Compute related theses dynamically using shared tags, keywords, and/or research area.

Consequences:

- A materialized `thesis_related` table is optional and should not be required for the first MVP schema.
- Related-thesis queries should exclude the current thesis and prioritize shared tags/research area.
- AI recommendations and semantic search remain future features.

### Decision 010: Keep public metadata browsing but restrict document access

Status: Accepted

Context: Students should be able to discover relevant work quickly, while document access remains controlled.

Decision: Published thesis metadata is publicly discoverable, but document preview/download requires authentication.

Consequences:

- Public pages can show title, author names, year, abstract preview, adviser, department, research area, and tags.
- Detail pages can show complete metadata and knowledge-transfer content.
- PDF controls should prompt login for anonymous users.
- Storage policies must not allow anonymous PDF reads.

### Decision 011: Allow school-email student self-registration

Status: Accepted

Context: Students need authenticated access for PDF preview and download without requiring manual administrator onboarding for every student.

Decision: Anyone with a `usc.edu.ph` email address may create a Student visitor account.

Consequences:

- Student PDF access can scale without admin-created accounts.
- Admin and Contributor accounts should still be controlled by administrators.
- Authentication implementation must validate or restrict signup to the `usc.edu.ph` email domain.
- Public anonymous users remain able to browse metadata without an account.

### Decision 012: Keep full published metadata public

Status: Accepted

Context: Alexandria's discovery goal depends on students quickly evaluating whether a thesis is relevant.

Decision: Full published thesis metadata is public, while PDF preview and download remain authenticated.

Consequences:

- Anonymous users can view thesis detail metadata, recommendations, lessons learned, tags, adviser, department, and research area.
- PDF access is the primary protected boundary.
- The frontend should not hide detail pages behind login.
- RLS/backend policies must distinguish metadata reads from storage object reads.

### Decision 013: Archive/unpublish instead of hard delete in normal UI

Status: Accepted

Context: Thesis repository data is institutional knowledge and should not be casually destroyed.

Decision: The normal admin removal action is archive/unpublish, with internal soft delete support.

Consequences:

- Public views should exclude archived records.
- Admin views may show archived records for recovery or review.
- The database should include status and/or soft delete fields.
- Hard delete should not be part of the ordinary admin workflow.

### Decision 014: Use Admin, Contributor, and Student visitor roles

Status: Accepted

Context: The system needs more than one privileged content role, while staying simple enough for MVP implementation.

Decision: Use three product roles: Admin, Contributor, and Student visitor.

Consequences:

- Admins manage accounts, roles, publishing, archive/unpublish actions, and system-level controls.
- Contributors help create and edit repository content.
- Student visitors browse metadata and access PDFs after authentication.
- Role checks should be reflected in backend logic and database policies.

### Decision 015: Use `draft`, `published`, and `archived` thesis statuses

Status: Accepted

Context: The repository needs a minimal status model for preparation, public visibility, and retirement.

Decision: Use `draft`, `published`, and `archived` as the MVP thesis statuses.

Consequences:

- Draft records are editable but not public.
- Published records are publicly discoverable.
- Archived records are hidden from public browsing/search.
- A separate review status is not part of MVP.

### Decision 016: Require recommendations and lessons, with separate meanings

Status: Accepted

Context: Recommendations and lessons learned are the project differentiator from a simple file repository.

Decision: Published thesis records must include both recommendations and lessons learned. Recommendations describe study gaps, research opportunities, limitations, and future work. Lessons learned describe practical execution guidance, process advice, tooling issues, team workflow advice, defense preparation, and implementation pitfalls.

Consequences:

- Publish validation should require at least one recommendation and at least one lesson learned.
- The UI should label the two sections distinctly.
- The database should keep recommendations and lessons in separate ordered tables.
- Seed/sample data should demonstrate the difference clearly.

### Decision 017: Retain old PDF metadata when replacing files

Status: Accepted

Context: PDFs may need correction or replacement, but the MVP does not need full student-facing version history.

Decision: When a PDF is replaced, keep old file metadata for audit/history and mark the newest valid file as primary.

Consequences:

- The database should support primary/non-primary file metadata.
- Admins can trace replacements.
- Students only need access to the current primary file.
- Full downloadable version history is excluded from MVP.

### Decision 018: Use search, filters, and sort for MVP discovery

Status: Accepted

Context: Students need to locate relevant theses quickly using multiple discovery paths.

Decision: MVP discovery includes keyword search, filters, and sorting.

Consequences:

- Search should cover title, author names, tags, abstract keywords, and year.
- Filters should include research area, adviser, department, and year.
- Sorting controls should be present in repository/search views.
- Full-text ranking can be added later if basic search feels weak.

### Decision 019: Default repository sort is newest thesis year first

Status: Accepted

Context: Students often need recent thesis examples first, and year is a familiar academic signal.

Decision: Repository browsing defaults to newest thesis year first.

Consequences:

- Repository and search result queries need deterministic year-descending ordering.
- Secondary ordering, such as title or created date, may be used to break ties.
- Best-match ranking is not the default MVP browse behavior.

### Decision 020: Use controlled research areas and flexible tags

Status: Accepted

Context: The project needs clean filtering without making keyword tagging too rigid.

Decision: Research areas are controlled values. Tags remain flexible keywords.

Consequences:

- Research area values should be managed by admins or seed data.
- Tags can be added to capture specific technologies, domains, and methods.
- Related-thesis discovery can use both curated research areas and flexible tags.
- The admin UI should make research area selection more controlled than tag entry.

## 2026-06-26

### Decision 021: Use a Supabase service layer for MVP data access

Status: Accepted

Context: The latest API contracts define a one-month MVP implementation where frontend code talks to Supabase through a local service layer instead of a custom REST server.

Decision: Build data access around service functions such as `ThesisService.getAll()` under `Alexandria/lib/services/`. UI components must not call `supabase.from(...)` directly.

Consequences:

- The backend/project-manager role should focus first on service boundaries, validation helpers, auth guards, and file proxy behavior.
- A separate REST backend is not required for the MVP unless later constraints force it.
- The service layer is the swap point if the app later moves to REST or GraphQL.

### Decision 022: Separate system role from USC affiliation

Status: Accepted

Context: The live Supabase schema uses `public.users.role` and `public.users.affiliation` as separate concepts.

Decision: Use `role` for system access and `affiliation` for USC identity.

Consequences:

- System roles are `admin`, `moderator`, and `member`.
- USC affiliations are `student`, `alumni`, and `professor`.
- Admin/moderator permissions should be checked against `users.role`.
- Professor/adviser identity should be derived from `users.affiliation = 'professor'` where needed.

### Decision 023: Use `public.users` as the app profile table

Status: Accepted

Context: Supabase Auth owns identity, but Alexandria needs profile name, USC ID, system role, and affiliation.

Decision: Store application profile data in `public.users`, linked to `auth.users.id`.

Consequences:

- The earlier `profiles` naming should be treated as superseded for implementation.
- Auth signup metadata must provide `profile_name`, `usc_id`, and `affiliation`.
- The `on_auth_user_created` trigger inserts the corresponding `public.users` row.

### Decision 024: Use thesis review status for publication visibility

Status: Accepted

Context: The live Supabase schema defines `review_status` as the thesis lifecycle field.

Decision: Use `review_status` values `for_review`, `flagged`, and `accepted`.

Consequences:

- Public repository queries should show only `accepted` records.
- Upload/submission flow creates `for_review` records.
- Moderator review can accept or flag records.
- Archive behavior needs an explicit implementation decision because `archived` is not currently part of the `review_status` check constraint.

### Decision 025: Proxy school-server PDF URLs instead of exposing raw file URLs

Status: Superseded by Decision 045

Context: The live schema stores `thesis_files.file_url`, pointing to PDFs hosted on department/school server infrastructure.

Decision: Store raw PDF URLs in `thesis_files.file_url`, but do not return them directly to unauthenticated clients. Authenticated PDF access should go through a proxy endpoint such as `GET /theses/:id/file`.

Consequences:

- The backend must verify the user's Supabase session before streaming or redirecting to a PDF.
- Public thesis metadata can include file availability, but not the raw URL.
- Supabase Storage is no longer the primary MVP file-storage assumption unless the team changes direction again.

### Decision 026: Store recommendations and lessons learned as thesis text fields

Status: Accepted

Context: The live schema keeps `recommendations` and `lessons_learned` on the `theses` table.

Decision: Treat recommendations and lessons learned as free-form thesis text fields for MVP implementation.

Consequences:

- Publish/accept validation should require both fields to be non-empty.
- The frontend can still display the two sections distinctly.
- Ordered recommendation/lesson subtables are deferred unless the schema changes.

### Decision 027: Compute related theses on the frontend from tag overlap for MVP

Status: Accepted

Context: The latest API contracts state that related theses are populated by matching overlapping tags against other accepted records.

Decision: Compute related theses on the frontend from raw accepted thesis/tag data for the MVP.

Consequences:

- The backend/service layer must provide enough accepted thesis/tag data for related-thesis computation.
- No `thesis_related` table is required for MVP.
- If result quality or performance becomes weak, this can move to a backend query later.

### Decision 028: Use `thesis_audits.change_description` for review history

Status: Accepted

Context: The live schema has `thesis_audits` with `change_description`; the `action` column was removed.

Decision: Record moderator/admin review history in `thesis_audits.change_description`.

Consequences:

- Accept/flag/archive-like actions should insert readable audit descriptions.
- Backend code should not depend on a separate `action` column.
- Audit filtering by action type may require a future structured field if needed.

### Decision 029: Allow members to submit theses for review

Status: Accepted

Context: Alexandria should support submissions from registered users, not only administrator-created records.

Decision: Any authenticated `member` may submit a thesis. Submitted theses enter `for_review` and must be approved by either an `admin` or a `moderator` before becoming publicly visible.

Consequences:

- Submission creation must allow the `member` role.
- Public repository queries must still show only approved/accepted records.
- Review actions remain restricted to `admin` and `moderator`.
- Backend services should distinguish submitter permissions from reviewer permissions.

### Decision 030: Treat moderator as the replacement for contributor

Status: Accepted

Context: Earlier planning used Contributor, but the current implementation vocabulary uses Moderator.

Decision: Use `moderator` as the final implementation role replacing the older contributor language.

Consequences:

- Contributor should be treated as an old planning term.
- UI and service checks should use `moderator`.
- Moderators can review, flag, approve/accept, and maintain submissions according to final permission rules.

### Decision 031: Treat member as the broad registered-user role

Status: Accepted

Context: Students are not the only users navigating Alexandria. The site may also be used by alumni and professors.

Decision: Use `member` as the broad registered-user role. Use `users.affiliation` to distinguish `student`, `alumni`, and `professor`.

Consequences:

- Student visitor language should be replaced in implementation-facing docs.
- `member` permissions should not depend on affiliation unless a specific feature requires it.
- Affiliation should be display/profile context, not system access control.

### Decision 032: Use review statuses for submission moderation

Status: Accepted

Context: The user flow is a submission review process, not only a draft/publish workflow.

Decision: Use review status language: `for_review`, `flagged`, approved/accepted, and `trashed`.

Consequences:

- `for_review` means pending moderator/admin review.
- `flagged` means fixable or needing more information.
- Approved/accepted means publicly visible.
- `trashed` means invalid, duplicate, spam, or intentionally removed from active workflows.
- The current SQL must be updated if `trashed` is represented in `review_status`.

### Decision 033: Authors and advisers do not require registered profiles

Status: Accepted

Context: Thesis authors and advisers may need to be displayed even when they do not have Alexandria accounts.

Decision: Store author and adviser display names independently from `public.users`. Link to a user profile only when one exists.

Consequences:

- The previous `thesis_authors.user_id NOT NULL` schema is too restrictive.
- Backend and database work should support nullable `user_id` plus required display names.
- Adviser modeling should not depend solely on `users.affiliation = 'professor'`.

### Decision 034: Keep `thesis_authors` but expand it for authors and advisers

Status: Accepted

Context: The database has been updated so authors and advisers can be stored even when they do not have Alexandria user accounts. The team chose to keep the existing table name `thesis_authors`.

Decision: Use `public.thesis_authors` with required `display_name`, optional `user_id`, `contribution_role` values `author` or `adviser`, and optional `sort_order`.

Consequences:

- Frontend and backend service types should read authors/advisers from `thesis_authors`.
- The table name is slightly narrower than its actual use, so developers must rely on `contribution_role`.
- Nullable `user_id` allows unregistered authors/advisers.
- `display_name` remains the source of truth for public display.

### Decision 035: Limit member edits to flagged submissions

Status: Accepted

Context: Members can submit theses, but the review queue should not keep changing while reviewers are evaluating it.

Decision: Members can edit their own submission only after it is `flagged`.

Consequences:

- New member submissions enter `for_review` and should be effectively locked for member edits.
- A moderator/admin can flag the submission to request revisions.
- After flagged, the owning member can edit and resubmit according to the final UI flow.

### Decision 036: Allow members to attach their own thesis files

Status: Accepted

Context: Submission should be self-service enough that members can provide the thesis PDF or file URL.

Decision: Members may attach/register the PDF or file URL for their own submission.

Consequences:

- File registration must verify ownership for `member` users.
- Admins and moderators can still attach or replace files for reviewable submissions.
- Raw `file_url` values remain protected from public responses.

### Decision 037: Allow admins and moderators to trash submissions

Status: Accepted

Context: Invalid, duplicate, spam, or unusable submissions need a final removal state outside the fixable `flagged` state.

Decision: Both `admin` and `moderator` can trash submissions.

Consequences:

- `flagged` remains the fixable correction state.
- `trashed` should hide records from public browsing and active review lists.
- Trashed records are not recoverable through the admin UI for MVP.

### Decision 038: Keep `accepted` as the internal approved state unless migrated later

Status: Accepted

Context: The current SQL already uses `review_status = 'accepted'`, while user-facing language may prefer Approved.

Decision: Keep `accepted` as the internal database/API value for now. The UI may display this state as `Approved`.

Consequences:

- Avoids an immediate status migration.
- Frontend can map `accepted` to the label `Approved`.
- If the team later wants internal naming consistency, Shane can migrate the check constraint and existing rows from `accepted` to `approved`.

## 2026-06-27

### Decision 039: Allow nullable thesis submission ownership for legacy and admin-uploaded records

Status: Accepted

Context: Some thesis records may be imported or uploaded by an admin rather than submitted by a member with an Alexandria profile.

Decision: Allow `theses.submitted_by_user_id` to be nullable for legacy, imported, or admin-uploaded thesis records. Member self-submissions must set `submitted_by_user_id`.

Consequences:

- Existing or admin-uploaded thesis records do not need fake owner accounts.
- Member-owned edit and file-registration rules can still be enforced for self-submitted records.
- Services should treat `submitted_by_user_id = null` as "no member owner," not as publicly editable.

### Decision 040: Enforce one primary PDF file per thesis

Status: Accepted

Context: Alexandria keeps old PDF file metadata for history, but the student-facing preview/download flow needs one current PDF.

Decision: Each thesis should have exactly one current primary file for PDF preview/download.

Consequences:

- `thesis_files.is_primary = true` identifies the current PDF.
- File registration/replacement services must prevent multiple primary files for the same thesis.
- The database should enforce this with a partial unique index on `thesis_files (thesis_id) WHERE is_primary = true` during the database prerequisite phase.
- Frontend contracts should use `file_access` and never need to choose between multiple primary files.

## 2026-06-30

### Decision 041: Allow guest access to all thesis content (including PDFs)

Status: Accepted

Context: The team discussed access controls and determined that requiring users to log in just to view thesis proposals or submissions creates unnecessary friction. 

Decision: Do not require login to view thesis submissions (including PDF files). The landing page should redirect immediately to the main repository where users can browse as guests. Authentication is only required when a user wants to contribute a paper.

Consequences:

- The landing page "log in and sign up" options are removed in favor of a direct view page redirect to the home page.
- PDF preview and download are no longer restricted to authenticated users.
- Decision 004, 010, and 012 are superseded regarding PDF authentication.
- API contracts must be updated so `requires_auth: false` for file access.

### Decision 022: Role-Based Routing and Access Control

Status: Accepted

Context: The application needs to handle routing and permissions distinctly for different user roles post-authentication. Specifically, the boundary between Admins (who have full control) and Moderators (who only review submissions). Members just read the public site.

Decision: 
1. Implement role-based post-auth redirects:
   - Admins redirect to `/admin/dashboard`
   - Moderators redirect to `/admin/dashboard` (until a moderator-specific dashboard is made)
   - Members redirect to `/home` (the public repository view)
2. Use strict layout guards (Server Components) on `/admin/members` and `/admin/moderators` to ensure ONLY Admins can access them. Moderators attempting to access these routes are redirected to `/admin/dashboard`.
3. Filter the `AdminSidebar` navigation links based on role so Moderators only see "Dashboard" and "Browse Repository".

Consequences:
- Moderators are securely confined to their thesis-review duties and cannot manage users.
- Role capability checks are enforced both in the UI rendering and server-side layouts.
- Replaces the generic post-auth repository redirect stub.

### Decision 042: Standardize Header Architecture

Status: Accepted

Context: The header layout and design were previously fragmented across pages (e.g. `/`, `/home`, `/profile`), resulting in inconsistent padding, search bar styles, and redundant code. The design also called for a flush-left, GitHub-style search bar.

Decision: Use a standardized header component system: `MinimalHeader` for non-app landing pages (e.g. `/`, `/login`), and `AppHeader` for all core application pages (e.g. `/home`, `/profile`, `/admin/*`).

Consequences:
- Inline `<header>` elements must not be used on individual pages.
- `AppHeader` takes a `role` prop to conditionally render role-specific navigation indicators (e.g., "Dashboard ->").
- The global GitHub-style flush-left search bar design is defined centrally in `AppHeader`. Any layout tweaks or visual enhancements automatically apply globally across the repository interface.

## 2026-07-01

### Decision 043: Move from feature-based to traditional architectural hierarchy

Status: Accepted

Context: The previous folder structure grouped code by features, which was creating circular dependencies and making it harder to find shared generic components and services.

Decision: Move away from a feature-based folder structure to a traditional architectural hierarchy (e.g., standardizing `lib/services/`, `components/`, etc.).

Consequences:

- Developers must place generic services in `lib/services/` and shared UI components in `components/`.
- Domain-specific logic should be organized by architectural layer rather than by feature.
- File imports will need to be updated across the repository.

### Decision 044: Standardize domain terminology to ThesisAuthors

Status: Accepted

Context: The codebase and documentation contained lingering references to `ThesisPeople` instead of the standardized `ThesisAuthors`, causing confusion for developers mapping API contracts to the database.

Decision: Standardize domain terminology by migrating all remaining `ThesisPeople` references in the codebase and documentation to `ThesisAuthors`.

Consequences:

- All frontend and backend types must use `ThesisAuthor`.
- Documentation referring to "Thesis People" should be updated to "Thesis Authors" or "Authors and Advisers".
- The database table remains `thesis_authors`.

### Decision 045: Use Supabase Storage with a stable file-access contract

Status: Accepted

Context: The implemented submission flow uploads PDFs to
`thesis_files_bucket` in Supabase Storage, while Decision 041 makes accepted
PDFs public to guests.

Decision: Keep Supabase Storage as the MVP file provider. Store its object URL
in `thesis_files.file_url`, but expose only `file_access.download_path` in thesis
DTOs. The current bucket is public, PDF-only, and limited to 10 MiB.

Consequences:

- Submission code uploads through the authenticated server action.
- Accepted thesis PDFs remain publicly accessible.
- A future `GET /api/theses/:id/file` route may stream or redirect to storage.
- Frontend components remain independent of the storage provider.

### Decision 046: Separate repository UI routes from thesis API routes

Status: Accepted

Context: The repository browsing page and future thesis resource API need clear,
non-overlapping names.

Decision: Use `/home` for the public repository page, retain `/upload` for the
submission page, and reserve `/api/theses` for future HTTP Route Handlers.
Current submission uses `submitThesis(FormData)` rather than an HTTP endpoint.

Consequences:

- Member post-authentication redirects target `/home`.
- Navigation links to the repository target `/home`.
- Future HTTP thesis routes live under `/api/theses`.
- `/upload/theses` is not part of the current or future route contract.
