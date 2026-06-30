# Sub-phase 07: Validation and Frontend Handoff

Owner: Homer
Shared with: Leira, Ethan, Shane
Mode: Planning first, implementation later

## Goal

Prepare validation rules, QA checks, and frontend handoff notes before wiring live services into pages.

## Acceptance Validation

A thesis cannot be accepted unless it has:

- title
- abstract
- year
- department
- research area
- at least one author
- at least one adviser
- at least one tag
- primary file
- recommendations
- lessons learned

## Validation Error Shape

Services should return:

```ts
{
  data: null,
  error: {
    code: "VALIDATION_FAILED",
    message: "Thesis is missing required fields.",
    details: {
      missing_fields: ["adviser", "primary_file"]
    }
  }
}
```

## QA Matrix

- Anonymous can list accepted theses.
- Anonymous cannot access PDF file.
- Member can submit thesis.
- Member cannot edit own `for_review` thesis.
- Member can edit own `flagged` thesis.
- Member can attach file to own submission.
- Moderator can accept, flag, and trash.
- Admin can manage users.
- Public services hide `for_review`, `flagged`, and `trashed`.
- Public detail never returns raw `file_url`.

## Handoff Notes

- Leira needs `ThesisCard`, `ThesisDetail`, and filter DTOs.
- Ethan needs current user, review row, validation errors, and action states.
- Shane needs ownership and file uniqueness DB notes.

## Exit Criteria

- Frontend team has a short wiring checklist.
- Backend validation fields match UI error display needs.
- QA cases cover role/status/file access boundaries.

