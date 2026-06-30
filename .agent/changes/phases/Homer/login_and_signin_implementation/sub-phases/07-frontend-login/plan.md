# Sub-phase 07: Mock-Backed Login Slice

Owner: Frontend agent

## Goal

Ship `/login` as a complete, testable frontend slice using the mock gateway.

## Behavior

- USC email and password validation
- Password visibility
- Pending state
- Incorrect-credentials alert
- Deferred password-recovery notice
- Registration-success notice
- Role-aware redirect

## Required Verification

```powershell
cd Alexandria
npm.cmd run test:run -- features/auth/components/login-form.test.tsx
npm.cmd run test:e2e -- e2e/login.spec.ts
npm.cmd run lint
npm.cmd run build
```

## Exit Criteria

- Login works in mock mode without backend code.
- Every login state in `login-acceptance.md` is implemented.
- No sign-up or backend service file is modified.

