# Handoff: Moderator Review Lifecycle Contract

**Date**: 2026-07-08
**Workspace**: Alexandria - DCISM Thesis Repository
**Next Focus**: Moderator review functionality and member revision flow

## Current State

The moderator pages have been preserved from the merged frontend branch and
normalized into the current admin route structure. They are still mock-backed.
The next implementation pass should wire those pages to the same thesis,
review, and file-access contracts used by the rest of Alexandria.

The canonical public repository route is `/home`. The root route `/` remains
the landing page. The `/theses` route is legacy compatibility only, and
`/api/theses` remains reserved for thesis API/file-access routes.

## Locked Review Lifecycle

Use the existing database review status values:

| Status | Meaning | Visibility |
| --- | --- | --- |
| `for_review` | Submitted and locked while waiting for moderator/admin action | Moderators and admins |
| `flagged` | Returned to the submitting member for revision with moderator comments | Submitting member, moderators, and admins |
| `accepted` | Approved and visible in the public repository | Public via `/home` |
| `trashed` | Removed from active review/public surfaces | Moderators and admins |

Allowed MVP transitions:

```text
for_review -> accepted
for_review -> flagged
for_review -> trashed
flagged -> for_review
flagged -> trashed
```

When a submission is `flagged`, the submitter can revise it. After the member
resubmits, the status returns to `for_review` and editing is locked again.
Members cannot retract or edit a thesis while it is already `for_review`.

Both moderators and admins can flag, accept, and trash submissions. Trashed
records are not recoverable through the admin UI for the MVP.

## Moderator Page Scope

The moderator review pages should not invent a separate status vocabulary. If
the UI labels use friendly words, keep them mapped to the backend values:

| UI Label | Backend Status |
| --- | --- |
| Pending | `for_review` |
| Flagged | `flagged` |
| Approved | `accepted` |

`/admin/published-studies` should remain only if it eventually provides
moderator/admin-specific metadata or actions, such as audit history, revert to
review, trash controls, or publication visibility controls. If it stays a
read-only accepted-theses list, it should be replaced later by a sidebar link to
`/home`.

## File And Comment Boundaries

Moderator and member views should not receive raw Supabase storage paths.
Continue using the frontend-safe file-access contract, such as
`file_access.download_path` or a route under `/api/theses`.

Moderator comments are part of the flagging workflow. The exact UI can still be
designed later, but the backend contract should treat comments as the reason a
flagged submission is returned to the member for revision.

## First Move For Next Agent

Start by replacing the mock moderator data with service-layer DTOs that use the
canonical review statuses above. Keep the current pages functional while moving
one route at a time from mock data to real services.
