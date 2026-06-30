# Sub-phase 06: Submission, Review, and File Services

Owner: Homer
Shared with: Ethan, Shane
Mode: Planning first, implementation later

## Goal

Plan the protected services needed by Ethan's auth/admin/moderation pages and member submission flow.

## Submission Service

- `SubmissionService.create(payload)`
- `SubmissionService.updateOwn(id, payload)`
- `SubmissionService.getOwn({ review_status, page, limit })` if member dashboard exists

Rules:

- Members can create submissions.
- New submissions start as `for_review`.
- Members can update only their own flagged submissions.
- Ownership depends on `submitted_by_user_id`.

## Review Service

- `ReviewService.getAll({ review_status, page, limit })`
- `ReviewService.accept(id)`
- `ReviewService.flag(id, reason?)`
- `ReviewService.trash(id)`

Rules:

- Admin and moderator can review.
- Accept validates required fields.
- Flag should write an audit reason.
- Trash hides from normal UI and is not recoverable in admin UI for MVP.

## File Service

- `FileService.register(thesisId, payload)`
- `FileService.replacePrimary(thesisId, payload)`
- `FileService.getDownloadPath(thesisId)`
- `FileService.getAuthenticatedFile(thesisId)`

Rules:

- Members can register files for their own submissions.
- Admin/moderator can register or replace files for reviewable submissions.
- Public detail never receives raw `file_url`.
- Frontend uses `download_path`.

## Shane-Shared Note

File uniqueness and ownership enforcement may require SQL/index/RLS help. Shane owns DB policy/indexing by default; Homer can assist or cover small SQL changes if needed.

## Exit Criteria

- Ethan can build moderation screens from stable service contracts.
- Member edit and file rules are enforceable.
- Review actions have audit behavior defined.

