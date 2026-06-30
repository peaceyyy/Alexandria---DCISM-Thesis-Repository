# Sign-Up Screen Acceptance Specification

Status: implementation-ready  
Owner: Designer agent  
Route: `/sign-up`  
Updated: 2026-06-30

## Acceptance Intent

The user-supplied Login and Sign-up composite is a directional reference, not
a pixel-for-pixel contract. Sign-up should clearly belong to the same
Alexandria auth system as Login while accommodating every field required by the
real registration payload.

Preserve:

- the charcoal canvas, compact header, blue wordmark, and clipped blue orbits;
- the narrow left-aligned form and segmented Login/Sign-up navigation;
- blue outlined controls and a blue Create Account action;
- accessible production sizes even where the reference uses microtype.

The supplied reference is a reduced `1271x449` composite. Do not upscale it
into a false `1440x1024` baseline. Capture the implemented `/sign-up` route at
`1440x1024` after sub-phase `08-frontend-signup`; that capture becomes the
visual-QA review image.

## Shared Boundaries

Reuse without alteration:

- `../02-design-visual-foundation/visual-foundation.md` for the shared shell,
  tokens, field anatomy, orbits, themes, and responsive rules;
- `../03-design-login-states/login-acceptance.md` for focus, message flow,
  pending behavior, mobile targets, and safe service-error presentation;
- `../01-scope-contract-freeze/contract-freeze.md` for the exact
  `RegisterPayload` and AuthGateway boundary.

Sign-up must not introduce a form card, shadows, glow, social authentication,
or direct Supabase access.

## Required Fields

| UI field | Payload field | Control | Rules |
| --- | --- | --- | --- |
| Full name | `profile_name` | Text input | Required; trim before submission |
| USC email | `email` | Email input | Required; lowercase and restrict to `usc.edu.ph` |
| USC ID | `usc_id` | Numeric text input | Required; digits only; convert to number |
| Affiliation | `affiliation` | Select | Required: Student, Alumni, or Professor |
| Password | `password` | Password input | Required |
| Confirm password | Not submitted | Password input | Required; must match Password |

`confirm_password` is frontend-only. It must never appear in
`RegisterPayload`.

## Desktop Composition

At `1440x1024`:

- The Sign-up tab is selected and exposes `aria-current="page"`.
- The Login tab links to `/login`.
- The form uses the shared `420px` maximum width.
- Full name and USC email each occupy a full row.
- USC ID and Affiliation share one two-column row with a `12px` gap.
- Password and Confirm password each occupy a full row.
- Create Account remains visible without requiring desktop scrolling at the
  reference viewport.
- If validation messages make the form taller, vertical scrolling is allowed;
  controls must never be compressed or overlapped merely to preserve the fold.
- Orbit geometry remains behind the content and never reduces control contrast.

Recommended field order:

1. Full name
2. USC email
3. USC ID and Affiliation
4. Password
5. Confirm password
6. Create Account

## Mobile Composition

At `390x844` and down to `320px`:

- All six fields stack in one column.
- USC ID appears before Affiliation.
- The form uses the available width and the page scrolls vertically.
- Create Account remains reachable through normal document flow.
- No field, select menu, message, or orbit creates horizontal overflow.
- Every interactive target is at least `44x44`.
- Input text remains at least `16px`.
- Password visibility controls retain accessible names and hit targets.

## Message and Spacing Rules

- Keep `16px` between field groups.
- In the USC ID/Affiliation desktop row, each control owns its error below
  itself; errors may make one column taller without overlapping the next row.
- Put field errors in document flow with `6px` top spacing.
- Keep at least `8px` between an error and the next control.
- Form-level service errors use `role="alert"` above Create Account.
- Status messages use `role="status"`.
- Long error text wraps within the form width.
- At 200% zoom, the page scrolls instead of clipping content.

## State Acceptance Matrix

### 1. Default Dark Desktop

- Dark theme is the initial appearance.
- Sign-up is the selected tab.
- All required fields and Create Account are visible.
- No validation or service messages are visible.
- The added USC ID/Affiliation row uses the shared blue border, radius,
  typography, and icon treatment.

### 2. Keyboard Focus

- Tab order follows Full name, USC email, USC ID, Affiliation, Password,
  password visibility, Confirm password, confirmation visibility, then
  Create Account.
- Every control uses the shared visible focus ring.
- Focus never changes control dimensions or causes orbit overlap.
- Enter submits from a text field when the form is valid.

### 3. Required-Field Validation

Use these exact messages:

| Field | Message |
| --- | --- |
| Full name | `Enter your full name.` |
| USC email | `Use your @usc.edu.ph email address.` |
| USC ID | `Enter a valid numeric USC ID.` |
| Affiliation | `Select your USC affiliation.` |
| Password | `Enter a password.` |

- Show all applicable field errors after a submit attempt.
- Associate each message through `aria-describedby`.
- Set each invalid control to `aria-invalid="true"`.
- Do not call the auth gateway when local validation fails.

### 4. Password-Match Error

- Exact copy: `Passwords do not match.`
- Associate the message with Confirm password.
- Password remains masked unless the user explicitly reveals it.
- Confirm password is never copied into the gateway payload.
- The gateway is not called until the values match.

### 5. Invalid Email Domain

- Client validation uses:
  `Use your @usc.edu.ph email address.`
- A gateway `INVALID_EMAIL_DOMAIN` response maps back to the USC email field.
- Do not show the backend error twice as both field and form errors.
- Preserve the other entered fields.

### 6. Duplicate Account or Service Error

- Render the gateway's safe `ServiceError.message` once with `role="alert"`.
- Preserve Full name, USC email, USC ID, and Affiliation.
- Do not render raw Supabase objects, codes, or stack traces.
- Restore Create Account after the request completes.

### 7. Password Visible

- Each password field has an independent Show/Hide control.
- Accessible names switch between `Show password`/`Hide password` and
  `Show confirmation password`/`Hide confirmation password`.
- Visibility toggles do not submit the form or resize fields.

### 8. Submitting

- Create Account changes to `Creating account...`.
- The button is disabled and the form exposes `aria-busy="true"`.
- Prevent duplicate requests.
- Keep entered values visible.
- Do not add a spinner if it shifts the button's dimensions.

### 9. Success Transition

- A successful gateway response navigates to `/login?registered=1`.
- Sign-up does not show a competing success toast before navigation.
- The Login page owns the final status:
  `Account created. Log in with your USC email.`

### 10. Light Theme

- Use the shared light-theme tokens and reduced orbit opacity.
- Theme switching preserves all form values and messages.
- Text, fields, focus rings, and the primary action meet WCAG AA contrast.
- The default remains dark unless a saved preference exists.

### 11. Mobile Default and Error

- All fields stack and remain reachable through vertical scrolling.
- Field errors appear beneath their controls.
- Create Account never overlaps the viewport edge or orbit artwork.
- At 200% zoom, the user can reach every field and message.
- Focusing an invalid field creates no horizontal scroll.

## Payload Acceptance

For valid input, the gateway receives exactly:

```ts
{
  email: string;
  password: string;
  profile_name: string;
  usc_id: number;
  affiliation: "student" | "alumni" | "professor";
}
```

The payload contains no confirmation field and no role field.

## Implementation Handoff

Sub-phase `08-frontend-signup` may implement this specification when its
frontend-foundation and shared-shell dependencies are complete.

Visual review after implementation must capture:

- dark desktop at `1440x1024`;
- dark mobile at `390x844`;
- required-field and password-match errors;
- a safe service-error state;
- the pending state;
- light theme;
- keyboard focus.

Acceptance prioritizes complete registration behavior, accessibility,
responsiveness, and Alexandria identity. Exact pixel matching to the reduced
directional reference is not required.
