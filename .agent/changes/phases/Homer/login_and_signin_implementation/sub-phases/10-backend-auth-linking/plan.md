# Sub-phase 10: Backend Auth Service Linking

Owner: Backend agent

## Goal

Replace mock auth with real service calls without changing any page or form component.

## Scope

- Verify shared service DTOs exist.
- Implement or verify `login(email, password)`.
- Implement or verify `registerMember(payload)`.
- Create `serviceAuthGateway`.
- Switch the exported gateway binding.
- Map backend failures into the existing `ServiceResult` shape.

## Prohibited Changes

- Form markup
- Design tokens
- Visual snapshots
- Route names
- RegisterPayload fields
- Direct Supabase imports inside frontend components

## Required Verification

```powershell
cd Alexandria
npm.cmd run test:run -- features/auth/lib/service-auth-gateway.test.ts
npm.cmd run test:run
npm.cmd run lint
npm.cmd run build
```

## Exit Criteria

- Adapter tests prove unchanged argument forwarding.
- Existing frontend and visual tests still pass.
- Real registration and login can be smoke-tested with an approved account.

