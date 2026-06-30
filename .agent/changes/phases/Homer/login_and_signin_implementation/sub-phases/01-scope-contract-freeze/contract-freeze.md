# Alexandria Login and Sign-Up Contract Freeze

Status: Locked  
Owner: Homer  
Locked: 2026-06-30  
Scope: Login and sign-up frontend, mock gateway, and backend auth-service linkage

## Authority and Precedence

The authoritative implementation sources are:

1. `docs/backend_functions.md` defines auth function signatures, shared types, and service result shapes.
2. `docs/backend-readiness-plan.md` defines current roles, authorization vocabulary, and auth terminology.
3. `docs/page_backend_mapping.md` maps Login to `login()` and Sign-up to `registerMember()`.

The approved `.agent/changes/phases/Homer/login_and_signin_implementation/2026-06-30-auth-frontend-implementation.md` is a supporting execution plan. It supplies UI-only decisions not specified by the authoritative backend documents: routes, redirects, the frontend boundary, sequence, and specialist review gates. If it conflicts with any authoritative source above, the authoritative source wins.

Older roadmap terms such as `contributor`, `student_visitor`, or registration labeled as “Sign In” do not apply to this work.

For visual decisions, user-provided acceptance screenshots outrank transient Figma renders. `docs/DESIGN.md` governs the Alexandria visual system and its accessibility overrides when exact mockup values are unsuitable for production.

## Locked Terminology and Routes

| User action | Meaning | Route | Service call |
| --- | --- | --- | --- |
| Login | Authenticate an existing account | `/login` | `login(email, password)` |
| Sign-up | Register a new account | `/sign-up` | `registerMember(payload)` |

The words “Sign In” must not be used to describe account registration. The Figma registration frame previously named `Sign In` is implemented and labeled as Sign-up because its action creates an account.

## Locked Auth Contracts

```ts
export async function login(
  email: string,
  password: string,
): Promise<ServiceResult<CurrentUser>>;

export async function registerMember(
  payload: RegisterPayload,
): Promise<ServiceResult<{ id: string }>>;
```

`RegisterPayload` contains exactly:

```ts
export type RegisterPayload = {
  email: string;
  password: string;
  profile_name: string;
  usc_id: number;
  affiliation: "student" | "alumni" | "professor";
};
```

Registration rules:

- Only `usc.edu.ph` email addresses are accepted.
- `usc_id` reaches the gateway as a number.
- `confirm_password` is a frontend-only validation field and is never sent in `RegisterPayload`.
- `affiliation` records USC identity and does not grant system permissions.
- Self-registration creates a member account; it does not grant `admin` or `moderator`.

Both Login and Sign-up use the shared `ServiceResult<T>` success/error envelope. UI components render safe `ServiceError` messages and never expose raw Supabase error objects.

## Locked Success Behavior

Login redirects by the returned `CurrentUser.role`:

| Role | Destination |
| --- | --- |
| `admin` | `/admin` |
| `moderator` | `/moderator` |
| `member` | `/` |

Successful sign-up redirects to `/login?registered=1`. The Login page then announces that the account was created.

## Frontend and Backend Boundary

- Login and Sign-up forms depend on an `AuthGateway` interface.
- Mock-mode frontend work binds `AuthGateway` to a deterministic mock implementation.
- Backend linking replaces only the gateway binding with an adapter around `login()` and `registerMember()`.
- Pages, form components, and other frontend components must not import Supabase or call `supabase.from(...)`.
- Only backend-owned service modules and the service adapter may depend on `Alexandria/lib/services/auth-service.ts`.
- Switching from mock mode to the real service must not require form-component restructuring.

## Password Recovery

Password recovery is outside the current backend contract and this implementation slice.

`Forgot Password?` may remain visible, but it opens an inline notice that password recovery is not yet available. It must not call an invented endpoint or Supabase directly.

## Visual Acceptance

- Default appearance is the approved dark state.
- Login and Sign-up require desktop and mobile review.
- User-provided acceptance screenshots take precedence over transient Figma renders.
- Sign-up must include the additional USC ID and Affiliation controls required by `RegisterPayload`.
- The designer must approve those added controls before the Sign-up visual baseline is accepted.
- Accessibility requirements in `docs/DESIGN.md` override inaccessible microtype or touch-target dimensions from the mockup.

## Ownership and Review Gates

| Owner | Inputs | Outputs | Completion gate |
| --- | --- | --- | --- |
| Designer agent | User screenshots, Figma auth frames, `docs/DESIGN.md`, this contract | Shared visual foundation, Login states, Sign-up extension, visual QA report | Desktop and mobile Login and Sign-up screenshots approved |
| Frontend agent | This contract and approved design artifacts | Routes, components, validation, mock `AuthGateway`, unit tests, browser tests | All mock-mode checks pass |
| Backend agent | `docs/backend_functions.md`, this contract, completed frontend gateway interface | Auth-service implementation and service adapter compatibility | Adapter contract tests and real-auth smoke tests pass |
| Orchestrator | All specialist outputs and verification evidence | Sequencing, conflict prevention, gate records, final acceptance | Designer and implementation gates are recorded |

The frontend mock-mode slice must pass before backend auth linking changes the gateway binding.

## Explicitly Deferred

- Password reset request, email confirmation, and update-password routes
- Social or third-party authentication
- Remember-me behavior
- Protected-route middleware and role-guard layouts outside the two auth pages
- Landing, catalog, profile, admin, and moderator page implementation

## Exit Decision

There are no unresolved field, route, redirect, terminology, ownership, or integration-boundary questions in this sub-phase.

This contract unblocks:

- `02-design-visual-foundation`
- `05-frontend-foundation`

Neither sub-phase begins automatically; each remains subject to its own user approval checkpoint.
