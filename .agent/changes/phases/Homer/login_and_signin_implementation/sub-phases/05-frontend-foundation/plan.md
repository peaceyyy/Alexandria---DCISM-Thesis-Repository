# Sub-phase 05: Frontend Contracts and Test Foundation

Owner: Frontend agent

## Goal

Create the smallest tested foundation needed by both auth routes without implementing either full page.

## Scope

- Test dependencies and scripts
- Vitest and Playwright configuration
- Alexandria fonts, metadata, and global tokens
- Auth DTOs matching `backend_functions.md`
- Pure validation functions
- `AuthGateway` interface
- Deterministic mock gateway

## Required Verification

```powershell
cd Alexandria
npm.cmd run test:run -- features/auth/lib/auth-validation.test.ts
npm.cmd run lint
npm.cmd run build
```

## Exit Criteria

- The validation test passes.
- The app builds with Inter and Khula.
- The mock gateway satisfies the same method signatures as the future service adapter.
- No page, shell, or complete form is implemented.

