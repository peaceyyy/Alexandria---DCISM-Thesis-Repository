# Sub-phase 04: Contract-Complete Sign-Up Design

Owner: Designer agent

## Goal

Extend the sign-up composition so it can submit the real backend payload without visual improvisation by the frontend agent.

## Required Fields

- Full name
- USC email
- USC ID
- Affiliation: Student, Alumni, Professor
- Password
- Confirm password

## Tasks

- Add USC ID and affiliation as one desktop row and stacked mobile controls.
- Keep the Create Account action visible at `1440x1024`.
- Specify validation, password-match, domain-error, duplicate-account, loading, and success-transition states.
- Verify the mobile page scrolls cleanly without horizontal overflow.
- Save the approved desktop screenshot and state acceptance document.

## Exit Criteria

- Every `RegisterPayload` field appears in the design.
- Added controls look native to the Alexandria form system.
- `sign-up-1440x1024.png` is approved.
- Sign-up frontend implementation may start.

