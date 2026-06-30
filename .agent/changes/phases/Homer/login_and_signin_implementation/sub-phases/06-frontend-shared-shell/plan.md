# Sub-phase 06: Shared Auth Shell Implementation

Owner: Frontend agent

## Goal

Implement the reusable shell and controls once, before either page-specific form is added.

## Components

- Auth route-group layout
- Brand header and hero
- Orbit background
- Theme and GitHub controls
- Auth tabs
- Standard field
- Password field

## Constraints

- Use the local Alexandria SVG.
- Keep the default dark screenshot stable.
- Use CSS variables for theme-aware text and surfaces.
- Keep mobile targets at least 44px.
- Do not add login or sign-up submission logic.

## Required Verification

```powershell
cd Alexandria
npm.cmd run test:run -- features/auth/components/auth-shell.test.tsx
npm.cmd run lint
npm.cmd run build
```

## Exit Criteria

- Shared shell renders without horizontal overflow at 1440px and 390px.
- Tabs link to `/login` and `/sign-up`.
- Password visibility and theme controls are keyboard accessible.

