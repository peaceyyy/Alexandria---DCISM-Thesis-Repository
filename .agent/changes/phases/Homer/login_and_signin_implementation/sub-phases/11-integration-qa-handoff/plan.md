# Sub-phase 11: Integration QA and Handoff

Owner: Homer

Shared with: Designer agent, Frontend agent, Backend agent

## Goal

Prove the complete auth slice works and record enough evidence for another agent or teammate to continue safely.

## Required Commands

```powershell
cd Alexandria
npm.cmd run test:run
npm.cmd run test:e2e
npm.cmd run lint
npm.cmd run build
```

## Live Checks

- Invalid USC-domain registration is blocked.
- Valid registration sends every RegisterPayload field.
- Registration redirects to `/login?registered=1`.
- Invalid credentials preserve the email and show a safe error.
- Member, moderator, and admin logins use their locked destinations.
- Session survives refresh.
- Desktop and mobile visual snapshots remain unchanged.

## Defect Routing

- Visual defect: return to sub-phase 09.
- Login behavior defect: return to sub-phase 07.
- Sign-up behavior defect: return to sub-phase 08.
- Service or session defect: return to sub-phase 10.

## Exit Criteria

- All commands pass with fresh evidence.
- Live checks are recorded.
- Designer, frontend, and backend sign-offs are present.
- Residual risks and deferred password recovery are explicit.

