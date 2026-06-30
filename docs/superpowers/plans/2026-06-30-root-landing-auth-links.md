# Root Landing and Auth Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep Alexandria's landing page at `/` and make its login and sign-up
buttons resolve inside the canonical `Alexandria/` Next.js application.

**Architecture:** Preserve the existing App Router landing page and add two
small route-local placeholders that the active auth work can replace in place.
Document `Alexandria/` as the canonical working directory and leave the legacy
`frontend/` tree untouched.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4

---

### Task 1: Complete the Root-to-Auth Route Wiring

**Files:**
- Modify: `Alexandria/app/page.tsx`
- Create: `Alexandria/app/login/page.tsx`
- Create: `Alexandria/app/sign-up/page.tsx`

- [x] **Step 1: Run the lightweight route assertion before implementation**

Run from the repository root:

```powershell
$landing = Get-Content -Raw "Alexandria/app/page.tsx"
$valid = (Test-Path "Alexandria/app/login/page.tsx") -and
  (Test-Path "Alexandria/app/sign-up/page.tsx") -and
  $landing.Contains('href="/login"') -and
  $landing.Contains('href="/sign-up"')
if (-not $valid) { throw "Root auth routes are not fully wired." }
```

Expected: FAIL because the canonical route pages do not yet exist and the
landing page still uses `/signup`.

- [x] **Step 2: Correct the landing sign-up destination**

In `Alexandria/app/page.tsx`, use:

```tsx
<Link
  href="/sign-up"
  className="inline-flex h-11 items-center justify-center rounded-full border border-[#368bfe] bg-transparent px-8 text-base font-semibold text-white transition-colors hover:bg-white/5"
>
  Sign Up
</Link>
```

- [x] **Step 3: Add the login placeholder route**

Create `Alexandria/app/login/page.tsx`:

```tsx
export default function LoginPage() {
  return <span>Login page</span>;
}
```

- [x] **Step 4: Add the canonical sign-up placeholder route**

Create `Alexandria/app/sign-up/page.tsx`:

```tsx
export default function SignUpPage() {
  return <span>Sign-up page</span>;
}
```

- [x] **Step 5: Re-run the route assertion**

Run the command from Step 1.

Expected: PASS with no output.

### Task 2: Document the Canonical Frontend Location and Routes

**Files:**
- Modify: `Alexandria/README.md`
- Modify: `docs/page_backend_mapping.md`

- [x] **Step 1: Replace the generated app README**

Document:

````markdown
# Alexandria Frontend

The production Next.js application lives in this `Alexandria/` directory.

## Local development

```powershell
cd Alexandria
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:3000`.

## Current routes

| Route | Purpose | Status |
| --- | --- | --- |
| `/` | Public landing page | Implemented |
| `/login` | Account login | Placeholder pending auth implementation |
| `/sign-up` | USC account registration | Placeholder pending auth implementation |

New frontend work belongs under `Alexandria/app/`. The repository-level
`frontend/` directory is legacy and is not the application workspace.
````

- [x] **Step 2: Add canonical routes to the backend mapping**

Change the Authentication & Entry table to:

```markdown
| Page | Route | Primary Backend Functions | Auth Required |
| :--- | :--- | :--- | :--- |
| **Landing Page** | `/` | *(None / Static routing)* | No |
| **Login Page** | `/login` | `login()` | No |
| **Sign-Up Page** | `/sign-up` | `registerMember()`, `isAllowedEmailDomain()` | No |
```

### Task 3: Verify the Integrated App

**Files:**
- Verify only; do not modify the legacy `frontend/` directory.

- [x] **Step 1: Run lint**

Run from `Alexandria/`:

```powershell
npm.cmd run lint
```

Expected: exit code 0.

- [x] **Step 2: Run the production build**

Run from `Alexandria/`:

```powershell
npm.cmd run build
```

Expected: exit code 0 with `/`, `/login`, and `/sign-up` in the generated route
list.

- [x] **Step 3: Review the final diff**

Confirm only the planned landing, auth-route, README, route-mapping, and plan
files changed. Preserve all unrelated working-tree edits.
