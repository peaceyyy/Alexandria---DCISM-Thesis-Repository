# Sub-phase 08: Mock-Backed Sign-Up Slice

Owner: Frontend agent

## Goal

Ship `/sign-up` as a complete frontend slice that already produces the real `RegisterPayload`.

## Required Fields

- `profile_name`
- `email`
- `usc_id`
- `affiliation`
- `password`
- confirmation field used only by the frontend

## Required Verification

```powershell
cd Alexandria
npm.cmd run test:run -- features/auth/components/sign-up-form.test.tsx
npm.cmd run test:e2e -- e2e/sign-up.spec.ts
npm.cmd run lint
npm.cmd run build
```

## Exit Criteria

- Sign-up works in mock mode.
- The gateway receives a numeric `usc_id` and no confirmation field.
- USC-domain and password-match errors are accessible.
- No login or backend service file is modified.

