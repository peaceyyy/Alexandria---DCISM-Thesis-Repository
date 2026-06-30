# Sub-phase 01: Contract Freeze and Team Alignment

Owner: Homer
Mode: Planning first, implementation later

## Goal

Lock the frontend-facing contract so Leira and Ethan can build pages without guessing field names or backend behavior.

## Tasks

- Review `docs/api-contracts.md` with Leira and Ethan.
- Confirm all frontend pages use service DTOs, not raw Supabase rows.
- Confirm IDs are numbers for thesis-related rows and UUID strings only for users.
- Confirm `accepted` is the internal value and `Approved` is only a UI label.
- Confirm public thesis detail uses `file_access.download_path`, not raw `file_url`.
- Confirm `thesis_authors` stores both authors and advisers through `contribution_role`.

## Frontend Handoff Notes

- Use `ThesisCard` for repository cards.
- Use `ThesisDetail` for selected thesis pages.
- Use `ThesisPerson` for both authors and advisers.
- Treat `recommendations` and `lessons_learned` as free-form strings.

## Exit Criteria

- Leira and Ethan agree the DTOs are enough for current page designs.
- Homer signs off that contract names match the current SQL.
- Any missing frontend field is added to the contract before implementation starts.

