# Sub-phase 09: Designer and Frontend Visual QA

Owners: Designer agent and Frontend agent

## Goal

Converge the implemented pages with approved references before any real backend behavior is introduced.

## Review Viewports

- `1440x1024`
- `390x844`
- Browser zoom: 100%, 125%, 200%

## Review Order

1. Shared shell and orbit geometry
2. Login default and error states
3. Sign-up default and error states
4. Light theme
5. Keyboard focus and mobile overflow

## Rules

- Designer identifies and approves visual corrections.
- Frontend agent applies only visual/accessibility changes.
- Gateway signatures, form payloads, and redirects are frozen.
- Baselines are generated only after the designer signs off.

## Required Verification

```powershell
cd Alexandria
npm.cmd run test:run
npm.cmd run test:e2e -- e2e/auth.visual.spec.ts
npm.cmd run lint
npm.cmd run build
```

## Exit Criteria

- Desktop and mobile snapshots pass without updating baselines.
- `visual-qa-report.md` records designer approval.
- Backend linking may start.

