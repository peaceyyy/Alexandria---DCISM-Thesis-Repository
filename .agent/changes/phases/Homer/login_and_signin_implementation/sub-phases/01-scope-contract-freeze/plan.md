# Sub-phase 01: Scope and Auth Contract Freeze

Owner: Homer

## Goal

Produce one signed contract that prevents designer, frontend, and backend agents from making incompatible assumptions.

## Tasks

- Lock `/login` and `/sign-up` route names.
- Lock the `RegisterPayload` fields: `email`, `password`, `profile_name`, `usc_id`, and `affiliation`.
- Lock role redirects for `admin`, `moderator`, and `member`.
- Record that user-provided screenshots outrank transient Figma renders.
- Record that password recovery is outside the current backend contract.
- Confirm the frontend integrates through `AuthGateway`, not Supabase imports.
- Assign file ownership and specialist review gates.

## Exit Criteria

- `contract-freeze.md` contains no unresolved field, route, or ownership questions.
- Designer, frontend, and backend agents can identify their exact inputs and outputs.
- Sub-phases 02 and 05 may be primed independently.

