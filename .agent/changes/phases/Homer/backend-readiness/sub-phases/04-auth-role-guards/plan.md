# Sub-phase 04: Auth and Role Guard Plan

Owner: Homer
Shared with: Ethan, Shane
Mode: Planning first, implementation later

## Goal

Define auth helper boundaries before protected services are implemented.

## Guard Rules

- `admin` can manage user roles.
- `admin` and `moderator` can accept, flag, trash, and review submissions.
- `member` can submit theses.
- `member` can edit their own thesis only after it is `flagged`.
- `member` can attach/register a file for their own submission.
- `affiliation` never grants permissions.

## Helpers To Plan

- `getCurrentUser()`
- `requireSession()`
- `requireRole(roles)`
- `isAdmin(user)`
- `isModerator(user)`
- `isMember(user)`
- `isOwner(thesis, user)`
- `canEditSubmission(thesis, user)`
- `canRegisterFile(thesis, user)`
- `isAllowedEmailDomain(email)`

## Shane-Shared Note

RLS policies should mirror these app-level rules where practical. Shane owns DB policy work, but Homer should review because frontend services depend on it.

## Exit Criteria

- Role matrix is unambiguous.
- Member ownership checks depend on `submitted_by_user_id`.
- Frontend auth states can be derived from `CurrentUser`.

