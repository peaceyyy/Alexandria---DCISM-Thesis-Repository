# Login and Sign-Up Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build production-ready, responsive login and sign-up pages that match the approved Alexandria visuals, work end-to-end with a mock auth gateway first, and then connect to the service contracts in `docs/backend_functions.md` without restructuring the UI.

**Architecture:** Keep App Router pages and the mostly static auth shell as Server Components. Put interactive forms, password visibility, theme switching, validation, and submission state in focused Client Components under `features/auth/`. Both forms depend on an `AuthGateway` interface; Phase A binds it to a deterministic mock implementation, while Phase B adds a service adapter around `login()` and `registerMember()`.

**Tech Stack:** Next.js 16.2 App Router, React 19.2, TypeScript 5, Tailwind CSS 4 plus a scoped CSS module for the concentric background geometry, `next/font/google` for Inter and Khula, Lucide React icons, Vitest with React Testing Library, and Playwright for navigation, responsive, and screenshot checks.

---

## Sources Of Truth

- Figma file: `1qmHdfnQiOqPB6CCO6OacI`, page `Page 1`
- Login frame: `86:85`, `1440x1024`
- Sign-up frame: `95:270`, `1440x1024`
- Visual rules: `docs/DESIGN.md`
- Auth signatures and DTOs: `docs/backend_functions.md`, section 4
- HTTP contract: `docs/api-contracts.md`, section 4
- Page ownership: `docs/page_backend_mapping.md`
- Next.js local guidance: `Alexandria/AGENTS.md` and `Alexandria/node_modules/next/dist/docs/`

The user-provided screenshots outrank Figma rendering when the two differ. Before visual regression baselines are approved, store the screenshots at:

```text
docs/design-references/auth/login-1440x1024.png
docs/design-references/auth/sign-up-1440x1024.png
```

## Locked Decisions

1. Routes are `/login` and `/sign-up`. The Figma frame named `Sign In` is treated as sign-up because its action is `Create Account`.
2. Default appearance is the dark Figma state. The theme control is functional, persists locally, and must not change the default screenshots.
3. Registration includes `USC ID` and `Affiliation` because `RegisterPayload` requires both. On desktop, these controls share one row; on mobile, they stack.
4. Designer approval is required for the added registration row before the sign-up screenshot baseline is accepted.
5. Login success redirects by role: `admin` to `/admin`, `moderator` to `/moderator`, and `member` to `/`.
6. Registration success redirects to `/login?registered=1`; the login page then announces that the account was created.
7. `Forgot Password?` remains visible but does not invent an unsupported backend call. In Phase A it opens an inline notice stating that password recovery is not yet available.
8. The repository link is `https://github.com/peaceyyy/Alexandria---DCISM-Thesis-Repository`.
9. The frontend never imports Supabase directly. Only the backend-owned service adapter may call functions from `Alexandria/lib/services/auth-service.ts`.

## Responsibility And Review Gates

| Role | Owns | Completion gate |
| --- | --- | --- |
| Designer agent | Screenshot references, logo export, sign-up contract-field extension, visual review | Approves desktop and mobile screenshots |
| Frontend agent | Routes, components, validation, mock gateway, unit/E2E tests | All mock-mode checks pass |
| Backend agent | `lib/services/` auth implementation and service adapter compatibility | Contract tests and real auth smoke test pass |
| Orchestrator | Task sequencing, conflict prevention, contract review, final acceptance | Both specialist gates are recorded |

The frontend agent must complete Tasks 1-8 before the backend agent edits auth integration files. The designer may review Tasks 3-8 as screenshots become available.

## File Map

### Create

```text
Alexandria/.gitignore
Alexandria/vitest.config.mts
Alexandria/vitest.setup.ts
Alexandria/playwright.config.ts
Alexandria/public/brand/alexandria-mark.svg
Alexandria/app/(auth)/layout.tsx
Alexandria/app/(auth)/login/page.tsx
Alexandria/app/(auth)/sign-up/page.tsx
Alexandria/features/auth/components/auth-shell.tsx
Alexandria/features/auth/components/auth-shell.module.css
Alexandria/features/auth/components/auth-tabs.tsx
Alexandria/features/auth/components/auth-field.tsx
Alexandria/features/auth/components/password-field.tsx
Alexandria/features/auth/components/theme-toggle.tsx
Alexandria/features/auth/components/login-form.tsx
Alexandria/features/auth/components/sign-up-form.tsx
Alexandria/features/auth/components/login-form.test.tsx
Alexandria/features/auth/components/sign-up-form.test.tsx
Alexandria/features/auth/lib/auth-contract.ts
Alexandria/features/auth/lib/auth-gateway.ts
Alexandria/features/auth/lib/auth-validation.ts
Alexandria/features/auth/lib/auth-validation.test.ts
Alexandria/features/auth/lib/mock-auth-gateway.ts
Alexandria/features/auth/lib/service-auth-gateway.ts
Alexandria/features/auth/lib/service-auth-gateway.test.ts
Alexandria/e2e/auth.spec.ts
Alexandria/e2e/auth.visual.spec.ts
docs/design-references/auth/README.md
```

### Modify

```text
Alexandria/package.json
Alexandria/package-lock.json
Alexandria/app/layout.tsx
Alexandria/app/globals.css
Alexandria/features/auth/lib/auth-gateway.ts
```

The backend agent separately owns the paths declared by `docs/backend_functions.md`:

```text
Alexandria/lib/services/types.ts
Alexandria/lib/services/result.ts
Alexandria/lib/services/auth-service.ts
Alexandria/lib/supabase/client.ts
Alexandria/lib/supabase/server.ts
```

## Visual Acceptance Contract

At `1440x1024`:

- Canvas background is `#14181C`.
- Header logo begins near `x=69`, `y=47`; mark size is `56x56`.
- Hero group begins near `x=69`, `y=127`.
- `ALEXANDRIA` uses Khula ExtraBold at approximately `100px`.
- Tagline uses Inter Black at approximately `35px`.
- Supporting line uses Inter Semi Bold at `20px`.
- The form column is `420px` wide and begins near `x=69`, `y=396`.
- Segmented auth tabs are about `420x57`.
- Inputs are about `420x60`, use `20px` radii, and have a `#368BFE` border.
- Primary buttons are about `234x46`, use `20px` radii, and use `#368BFE`.
- Concentric blue ellipses occupy the right side without covering the form.
- The default screenshot is dark even when the system prefers light mode.

At `390x844`:

- No horizontal scrolling is allowed.
- The logo, tabs, fields, button, and status messages remain fully visible.
- All interactive targets are at least `44x44`.
- The hero copy scales down; the blue ellipse treatment becomes a clipped background accent.
- The sign-up page may scroll vertically, but the submit button must not be hidden behind browser chrome.

---

### Task 1: Install The Test And UI Tooling

**Owner:** Frontend agent

**Files:**
- Modify: `Alexandria/package.json`
- Modify: `Alexandria/package-lock.json`
- Create: `Alexandria/vitest.config.mts`
- Create: `Alexandria/vitest.setup.ts`
- Create: `Alexandria/playwright.config.ts`
- Create: `Alexandria/.gitignore`

- [ ] **Step 1: Install the focused dependencies**

Run from `Alexandria/`:

```powershell
npm.cmd install lucide-react
npm.cmd install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/user-event @testing-library/jest-dom vite-tsconfig-paths @playwright/test
npx.cmd playwright install chromium
```

Expected: `package.json` and `package-lock.json` update without peer-dependency errors.

- [ ] **Step 2: Add deterministic scripts**

Add these scripts to `Alexandria/package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest",
    "test:run": "vitest run",
    "test:e2e": "playwright test",
    "test:e2e:update": "playwright test e2e/auth.visual.spec.ts --update-snapshots"
  }
}
```

- [ ] **Step 3: Configure Vitest**

Create `Alexandria/vitest.config.mts`:

```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    css: true,
    passWithNoTests: true,
  },
});
```

Create `Alexandria/vitest.setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Configure Playwright**

Create `Alexandria/playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 5"] } },
  ],
  webServer: {
    command: "npm.cmd run dev -- --hostname 127.0.0.1",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

- [ ] **Step 5: Ignore generated output**

Create `Alexandria/.gitignore`:

```gitignore
node_modules/
.next/
out/
coverage/
playwright-report/
test-results/
*.tsbuildinfo
.env*
!.env.example
```

- [ ] **Step 6: Verify the harness**

Run:

```powershell
npm.cmd run test:run
npm.cmd run lint
```

Expected: Vitest exits successfully with no test files, and ESLint passes.

- [ ] **Step 7: Commit**

```powershell
git add Alexandria/package.json Alexandria/package-lock.json Alexandria/vitest.config.mts Alexandria/vitest.setup.ts Alexandria/playwright.config.ts Alexandria/.gitignore
git commit -m "test: add auth frontend test harness"
```

---

### Task 2: Define The Frontend Auth Contract And Validation

**Owner:** Frontend agent

**Files:**
- Create: `Alexandria/features/auth/lib/auth-contract.ts`
- Create: `Alexandria/features/auth/lib/auth-validation.ts`
- Create: `Alexandria/features/auth/lib/auth-validation.test.ts`

- [ ] **Step 1: Write failing validation tests**

Create `Alexandria/features/auth/lib/auth-validation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  validateLoginInput,
  validateRegistrationInput,
} from "./auth-validation";

describe("validateLoginInput", () => {
  it("requires a USC email and password", () => {
    expect(validateLoginInput({ email: "user@gmail.com", password: "" })).toEqual({
      email: "Use your @usc.edu.ph email address.",
      password: "Enter your password.",
    });
  });
});

describe("validateRegistrationInput", () => {
  it("validates every backend-required registration field", () => {
    expect(
      validateRegistrationInput({
        profile_name: "",
        email: "user@gmail.com",
        usc_id: "",
        affiliation: "",
        password: "password",
        confirm_password: "different",
      }),
    ).toEqual({
      profile_name: "Enter your full name.",
      email: "Use your @usc.edu.ph email address.",
      usc_id: "Enter a valid numeric USC ID.",
      affiliation: "Select your USC affiliation.",
      confirm_password: "Passwords do not match.",
    });
  });
});
```

- [ ] **Step 2: Run the tests to verify failure**

Run:

```powershell
npm.cmd run test:run -- features/auth/lib/auth-validation.test.ts
```

Expected: FAIL because the contract and validation modules do not exist.

- [ ] **Step 3: Define contract-shaped frontend types**

Create `Alexandria/features/auth/lib/auth-contract.ts`:

```ts
export type UserRole = "admin" | "moderator" | "member";
export type Affiliation = "student" | "alumni" | "professor";

export type ServiceError = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

export type ServiceResult<T> =
  | { data: T; error: null }
  | { data: null; error: ServiceError };

export type CurrentUser = {
  id: string;
  email: string;
  profile_name: string;
  usc_id: number;
  role: UserRole;
  affiliation: Affiliation;
};

export type RegisterPayload = {
  email: string;
  password: string;
  profile_name: string;
  usc_id: number;
  affiliation: Affiliation;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegistrationFormInput = {
  profile_name: string;
  email: string;
  usc_id: string;
  affiliation: Affiliation | "";
  password: string;
  confirm_password: string;
};

export type FieldErrors<T> = Partial<Record<keyof T, string>>;
```

- [ ] **Step 4: Implement pure validation**

Create `Alexandria/features/auth/lib/auth-validation.ts`:

```ts
import type {
  FieldErrors,
  LoginInput,
  RegistrationFormInput,
} from "./auth-contract";

export function isUscEmail(email: string): boolean {
  return /^[^\s@]+@usc\.edu\.ph$/i.test(email.trim());
}

export function validateLoginInput(
  input: LoginInput,
): FieldErrors<LoginInput> {
  const errors: FieldErrors<LoginInput> = {};
  if (!isUscEmail(input.email)) {
    errors.email = "Use your @usc.edu.ph email address.";
  }
  if (!input.password) {
    errors.password = "Enter your password.";
  }
  return errors;
}

export function validateRegistrationInput(
  input: RegistrationFormInput,
): FieldErrors<RegistrationFormInput> {
  const errors: FieldErrors<RegistrationFormInput> = {};
  if (input.profile_name.trim().length < 2) {
    errors.profile_name = "Enter your full name.";
  }
  if (!isUscEmail(input.email)) {
    errors.email = "Use your @usc.edu.ph email address.";
  }
  if (!/^\d+$/.test(input.usc_id)) {
    errors.usc_id = "Enter a valid numeric USC ID.";
  }
  if (!input.affiliation) {
    errors.affiliation = "Select your USC affiliation.";
  }
  if (input.password.length < 8) {
    errors.password = "Use at least 8 characters.";
  }
  if (input.confirm_password !== input.password) {
    errors.confirm_password = "Passwords do not match.";
  }
  return errors;
}
```

- [ ] **Step 5: Run the tests**

Run:

```powershell
npm.cmd run test:run -- features/auth/lib/auth-validation.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add Alexandria/features/auth/lib
git commit -m "feat: define frontend auth contracts and validation"
```

---

### Task 3: Establish Fonts, Tokens, Theme, And Brand Assets

**Owner:** Frontend agent, with designer asset approval

**Files:**
- Modify: `Alexandria/app/layout.tsx`
- Modify: `Alexandria/app/globals.css`
- Create: `Alexandria/public/brand/alexandria-mark.svg`
- Create: `Alexandria/features/auth/components/theme-toggle.tsx`
- Create: `docs/design-references/auth/README.md`

- [ ] **Step 1: Export the logo**

Export the Alexandria mark from Figma node `95:308` as SVG and save it at:

```text
Alexandria/public/brand/alexandria-mark.svg
```

Acceptance: the SVG has a tight `viewBox`, no embedded remote URLs, and remains recognizable at `24x24`.

- [ ] **Step 2: Replace starter fonts and metadata**

Update `Alexandria/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter, Khula } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const khula = Khula({
  variable: "--font-khula",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Alexandria",
    template: "%s | Alexandria",
  },
  description: "DCISM thesis, research, and capstone repository.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${khula.variable}`}
      suppressHydrationWarning
    >
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Replace starter global tokens**

Replace `Alexandria/app/globals.css` with:

```css
@import "tailwindcss";

:root {
  color-scheme: dark;
  --color-bg: #14181c;
  --color-surface: #1e1e1e;
  --color-text: #ffffff;
  --color-text-muted: #969696;
  --color-placeholder: #565758;
  --color-border: #368bfe;
  --color-brand: #1752f0;
  --color-brand-bright: #368bfe;
  --color-pronunciation: #ffd900;
  --color-danger: #ff6b6b;
  --color-success: #59c987;
  --font-sans: var(--font-inter);
  --font-display: var(--font-khula);
}

:root[data-theme="light"] {
  color-scheme: light;
  --color-bg: #f5f7fa;
  --color-surface: #ffffff;
  --color-text: #14181c;
  --color-text-muted: #59616a;
  --color-placeholder: #6d747c;
}

* {
  box-sizing: border-box;
}

html,
body {
  min-height: 100%;
}

body {
  margin: 0;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans), system-ui, sans-serif;
}

button,
input,
select {
  font: inherit;
}

button,
a,
input,
select {
  -webkit-tap-highlight-color: transparent;
}

:focus-visible {
  outline: 3px solid var(--color-brand-bright);
  outline-offset: 3px;
}
```

- [ ] **Step 4: Implement the functional theme control**

Create `Alexandria/features/auth/components/theme-toggle.tsx`:

```tsx
"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "dark" | "light";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem("alexandria-theme");
    const initial: Theme = stored === "light" ? "light" : "dark";
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("alexandria-theme", next);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      className="inline-flex h-11 min-w-16 items-center justify-center gap-2 rounded-full border border-white/80 bg-[#1e1e1e] px-2 text-white"
    >
      <Sun aria-hidden size={18} />
      <Moon aria-hidden size={18} />
    </button>
  );
}
```

- [ ] **Step 5: Record screenshot ownership**

Create `docs/design-references/auth/README.md`:

```md
# Auth Visual References

- Desktop source size: 1440x1024.
- `login-1440x1024.png` is the login acceptance image.
- `sign-up-1440x1024.png` is the sign-up acceptance image.
- User-provided screenshots outrank transient Figma MCP renders.
- Sign-up approval must include USC ID and affiliation controls because the backend contract requires them.
- Playwright snapshots are generated only after the designer marks both references approved.
```

- [ ] **Step 6: Verify**

Run:

```powershell
npm.cmd run lint
npm.cmd run build
```

Expected: both commands pass and metadata uses Alexandria branding.

- [ ] **Step 7: Commit**

```powershell
git add Alexandria/app/layout.tsx Alexandria/app/globals.css Alexandria/public/brand/alexandria-mark.svg Alexandria/features/auth/components/theme-toggle.tsx docs/design-references/auth/README.md
git commit -m "feat: establish Alexandria auth visual foundation"
```

---

### Task 4: Build The Shared Auth Shell And Controls

**Owner:** Frontend agent

**Files:**
- Create: `Alexandria/app/(auth)/layout.tsx`
- Create: `Alexandria/features/auth/components/auth-shell.tsx`
- Create: `Alexandria/features/auth/components/auth-shell.module.css`
- Create: `Alexandria/features/auth/components/auth-tabs.tsx`
- Create: `Alexandria/features/auth/components/auth-field.tsx`
- Create: `Alexandria/features/auth/components/password-field.tsx`

- [ ] **Step 1: Create the auth route layout**

Create `Alexandria/app/(auth)/layout.tsx`:

```tsx
export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
```

- [ ] **Step 2: Implement the shell geometry**

Create `Alexandria/features/auth/components/auth-shell.module.css` with:

```css
.shell {
  position: relative;
  min-height: 100svh;
  overflow: hidden;
  background: var(--color-bg);
}

.content {
  position: relative;
  z-index: 2;
  width: min(854px, calc(100% - 48px));
  padding: 47px 0 64px 69px;
}

.orbits {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.orbit {
  position: absolute;
  top: -39.5%;
  left: 59.4%;
  border-radius: 50%;
}

.orbitOuter {
  width: 69.45vw;
  aspect-ratio: 1000 / 1809;
  background: #368bfe;
}

.orbitMiddle {
  width: 55.56vw;
  aspect-ratio: 800 / 1447.2;
  background: #0f78f7;
  left: 66.4%;
  top: -21.8%;
}

.orbitInner {
  width: 41.67vw;
  aspect-ratio: 600 / 1085.4;
  background: #1752f0;
  left: 73.3%;
  top: -4.1%;
}

.formSlot {
  width: 420px;
  max-width: 100%;
  margin-top: 24px;
}

@media (max-width: 760px) {
  .shell {
    overflow-y: auto;
  }

  .content {
    width: 100%;
    padding: 24px 20px 48px;
  }

  .orbits {
    opacity: 0.32;
  }

  .orbit {
    left: 68%;
    top: -5%;
  }

  .orbitOuter {
    left: 58%;
    width: 150vw;
  }

  .orbitMiddle {
    left: 70%;
    width: 120vw;
  }

  .orbitInner {
    left: 82%;
    width: 90vw;
  }

  .formSlot {
    width: 100%;
  }
}
```

- [ ] **Step 3: Implement the server-rendered shell**

Create `Alexandria/features/auth/components/auth-shell.tsx`:

```tsx
import { Github } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { ThemeToggle } from "./theme-toggle";
import styles from "./auth-shell.module.css";

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className={styles.shell}>
      <div className={styles.orbits} aria-hidden>
        <span className={`${styles.orbit} ${styles.orbitOuter}`} />
        <span className={`${styles.orbit} ${styles.orbitMiddle}`} />
        <span className={`${styles.orbit} ${styles.orbitInner}`} />
      </div>

      <div className="absolute right-11 top-12 z-10 flex items-center gap-4 max-sm:right-5 max-sm:top-5">
        <ThemeToggle />
        <a
          href="https://github.com/peaceyyy/Alexandria---DCISM-Thesis-Repository"
          target="_blank"
          rel="noreferrer"
          aria-label="Open Alexandria on GitHub"
          className="grid size-12 place-items-center rounded-full bg-white text-[#14181c]"
        >
          <Github aria-hidden size={26} />
        </a>
      </div>

      <section className={styles.content}>
        <a
          href="/"
          className="inline-flex items-center gap-2 text-[var(--color-text)]"
        >
          <Image
            src="/brand/alexandria-mark.svg"
            width={56}
            height={56}
            alt=""
            priority
          />
          <span className="text-[25px] font-black max-sm:hidden">ALEXANDRIA</span>
        </a>

        <header className="mt-5 max-w-[854px]">
          <div className="flex items-end gap-3">
            <h1 className="font-[var(--font-display)] text-[clamp(4rem,7vw,6.25rem)] font-extrabold leading-none text-[#368bfe]">
              ALEXANDRIA
            </h1>
            <span className="mb-3 text-[15px] text-[#ffd900] max-md:hidden">
              (al-ig-ZAN-dree-uh)
            </span>
          </div>
          <p className="text-[clamp(1.65rem,2.45vw,2.2rem)] font-black leading-tight text-[var(--color-text)]">
            Thesis, Research, and Capstone Hub
          </p>
          <p className="mt-2 text-xl font-semibold text-[#969696]">
            by DCISM Students, for DCISM Students
          </p>
        </header>

        <div className={styles.formSlot}>{children}</div>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Implement semantic tabs**

Create `Alexandria/features/auth/components/auth-tabs.tsx`:

```tsx
import Link from "next/link";

export function AuthTabs({ active }: { active: "login" | "sign-up" }) {
  return (
    <nav
      aria-label="Authentication"
      className="grid h-[57px] grid-cols-2 rounded-[20px] border border-[#368bfe] p-1"
    >
      <Link
        href="/login"
        aria-current={active === "login" ? "page" : undefined}
        className={`grid place-items-center rounded-[18px] font-[var(--font-display)] text-xl font-semibold ${
          active === "login"
            ? "bg-[#368bfe] text-white"
            : "text-[var(--color-text)]"
        }`}
      >
        Log In
      </Link>
      <Link
        href="/sign-up"
        aria-current={active === "sign-up" ? "page" : undefined}
        className={`grid place-items-center rounded-[18px] font-[var(--font-display)] text-xl font-semibold ${
          active === "sign-up"
            ? "bg-[#368bfe] text-white"
            : "text-[var(--color-text)]"
        }`}
      >
        Sign Up
      </Link>
    </nav>
  );
}
```

- [ ] **Step 5: Implement accessible fields**

Create `Alexandria/features/auth/components/auth-field.tsx` as a typed input wrapper with a visible-on-error message:

```tsx
import type { ComponentProps, ReactNode } from "react";

type AuthFieldProps = ComponentProps<"input"> & {
  label: string;
  icon: ReactNode;
  error?: string;
};

export function AuthField({
  label,
  icon,
  error,
  id,
  ...inputProps
}: AuthFieldProps) {
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className="h-[60px] w-full rounded-[20px] border border-[#368bfe] bg-transparent px-6 pr-14 text-xl text-[var(--color-text)] placeholder:text-[#565758]"
          {...inputProps}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-[#565758]"
        >
          {icon}
        </span>
      </div>
      {error ? (
        <p id={errorId} className="mt-1 px-2 text-sm text-[#ff6b6b]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
```

Create `Alexandria/features/auth/components/password-field.tsx`:

```tsx
"use client";

import { Eye, EyeOff } from "lucide-react";
import type { ComponentProps } from "react";
import { useState } from "react";

type PasswordFieldProps = Omit<ComponentProps<"input">, "type"> & {
  label: string;
  error?: string;
};

export function PasswordField({
  label,
  error,
  id,
  ...inputProps
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className="h-[60px] w-full rounded-[20px] border border-[#368bfe] bg-transparent px-6 pr-14 text-xl text-[var(--color-text)] placeholder:text-[#565758]"
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
          className="absolute right-2 top-1/2 grid size-11 -translate-y-1/2 place-items-center text-[#565758]"
        >
          {visible ? <EyeOff aria-hidden size={28} /> : <Eye aria-hidden size={28} />}
        </button>
      </div>
      {error ? (
        <p id={errorId} className="mt-1 px-2 text-sm text-[#ff6b6b]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 6: Verify**

Run:

```powershell
npm.cmd run lint
npm.cmd run build
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add Alexandria/app/'(auth)' Alexandria/features/auth/components
git commit -m "feat: build shared Alexandria auth shell"
```

---

### Task 5: Implement The Mock Gateway And Login Page

**Owner:** Frontend agent

**Files:**
- Create: `Alexandria/features/auth/lib/mock-auth-gateway.ts`
- Create: `Alexandria/features/auth/lib/auth-gateway.ts`
- Create: `Alexandria/features/auth/components/login-form.test.tsx`
- Create: `Alexandria/features/auth/components/login-form.tsx`
- Create: `Alexandria/app/(auth)/login/page.tsx`

- [ ] **Step 1: Define the gateway**

Create `Alexandria/features/auth/lib/auth-gateway.ts`:

```ts
import type {
  CurrentUser,
  RegisterPayload,
  ServiceResult,
} from "./auth-contract";
import { mockAuthGateway } from "./mock-auth-gateway";

export type AuthGateway = {
  login(email: string, password: string): Promise<ServiceResult<CurrentUser>>;
  registerMember(
    payload: RegisterPayload,
  ): Promise<ServiceResult<{ id: string }>>;
};

export const authGateway: AuthGateway = mockAuthGateway;
```

- [ ] **Step 2: Create deterministic mock behavior**

Create `Alexandria/features/auth/lib/mock-auth-gateway.ts`:

```ts
import type { AuthGateway } from "./auth-gateway";

const wait = () => new Promise((resolve) => window.setTimeout(resolve, 250));

export const mockAuthGateway: AuthGateway = {
  async login(email) {
    await wait();
    if (email.toLowerCase() === "error@usc.edu.ph") {
      return {
        data: null,
        error: {
          code: "SUPABASE_ERROR",
          message: "The email or password is incorrect.",
        },
      };
    }
    const role = email.startsWith("admin")
      ? "admin"
      : email.startsWith("moderator")
        ? "moderator"
        : "member";
    return {
      data: {
        id: "mock-user",
        email,
        profile_name: "Alexandria Member",
        usc_id: 12345678,
        role,
        affiliation: "student",
      },
      error: null,
    };
  },
  async registerMember() {
    await wait();
    return { data: { id: "mock-user" }, error: null };
  },
};
```

- [ ] **Step 3: Write failing login interaction tests**

Create `Alexandria/features/auth/components/login-form.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { AuthGateway } from "../lib/auth-gateway";
import { LoginForm } from "./login-form";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

function makeGateway(): AuthGateway {
  return {
    login: vi.fn(),
    registerMember: vi.fn(),
  };
}

describe("LoginForm", () => {
  it("blocks invalid input before calling the gateway", async () => {
    const gateway = makeGateway();
    render(<LoginForm gateway={gateway} />);
    await userEvent.click(screen.getByRole("button", { name: "Login" }));
    expect(screen.getByText("Use your @usc.edu.ph email address.")).toBeVisible();
    expect(screen.getByText("Enter your password.")).toBeVisible();
    expect(gateway.login).not.toHaveBeenCalled();
  });

  it("submits valid credentials and redirects by role", async () => {
    const gateway = makeGateway();
    vi.mocked(gateway.login).mockResolvedValue({
      data: {
        id: "1",
        email: "admin@usc.edu.ph",
        profile_name: "Admin",
        usc_id: 12345678,
        role: "admin",
        affiliation: "professor",
      },
      error: null,
    });
    render(<LoginForm gateway={gateway} />);
    await userEvent.type(screen.getByLabelText("Student email"), "admin@usc.edu.ph");
    await userEvent.type(screen.getByLabelText("Password"), "password");
    await userEvent.click(screen.getByRole("button", { name: "Login" }));
    expect(gateway.login).toHaveBeenCalledWith("admin@usc.edu.ph", "password");
    expect(push).toHaveBeenCalledWith("/admin");
  });

  it("shows a service error without clearing the email", async () => {
    const gateway = makeGateway();
    vi.mocked(gateway.login).mockResolvedValue({
      data: null,
      error: { code: "SUPABASE_ERROR", message: "The email or password is incorrect." },
    });
    render(<LoginForm gateway={gateway} />);
    const email = screen.getByLabelText("Student email");
    await userEvent.type(email, "error@usc.edu.ph");
    await userEvent.type(screen.getByLabelText("Password"), "password");
    await userEvent.click(screen.getByRole("button", { name: "Login" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The email or password is incorrect.",
    );
    expect(email).toHaveValue("error@usc.edu.ph");
  });

  it("reveals a scoped password-recovery notice", async () => {
    render(<LoginForm gateway={makeGateway()} />);
    await userEvent.click(screen.getByRole("button", { name: "Forgot Password?" }));
    expect(screen.getByRole("status")).toHaveTextContent(
      "Password recovery is not available in this frontend phase.",
    );
  });
});
```

- [ ] **Step 4: Run the test to verify failure**

Run:

```powershell
npm.cmd run test:run -- features/auth/components/login-form.test.tsx
```

Expected: FAIL because `LoginForm` does not exist.

- [ ] **Step 5: Implement the login form**

Create `Alexandria/features/auth/components/login-form.tsx`:

```tsx
"use client";

import { Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import type { FieldErrors, LoginInput } from "../lib/auth-contract";
import { authGateway, type AuthGateway } from "../lib/auth-gateway";
import { validateLoginInput } from "../lib/auth-validation";
import { AuthField } from "./auth-field";
import { AuthTabs } from "./auth-tabs";
import { PasswordField } from "./password-field";

export function LoginForm({
  gateway = authGateway,
  registered = false,
}: {
  gateway?: AuthGateway;
  registered?: boolean;
}) {
  const router = useRouter();
  const [input, setInput] = useState<LoginInput>({ email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors<LoginInput>>({});
  const [serviceError, setServiceError] = useState("");
  const [recoveryNotice, setRecoveryNotice] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateLoginInput(input);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setServiceError("");
    setPending(true);
    const result = await gateway.login(input.email.trim(), input.password);
    setPending(false);

    if (result.error) {
      setServiceError(result.error.message);
      return;
    }

    const destination = {
      admin: "/admin",
      moderator: "/moderator",
      member: "/",
    }[result.data.role];
    router.push(destination);
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <AuthTabs active="login" />
      {registered ? (
        <p role="status" className="text-sm text-[var(--color-success)]">
          Account created. Log in with your USC email.
        </p>
      ) : null}
      <AuthField
        id="login-email"
        name="email"
        label="Student email"
        type="email"
        autoComplete="email"
        placeholder="Enter your student email"
        value={input.email}
        onChange={(event) => setInput({ ...input, email: event.target.value })}
        icon={<Mail size={28} />}
        error={errors.email}
      />
      <PasswordField
        id="login-password"
        name="password"
        label="Password"
        autoComplete="current-password"
        placeholder="Enter your password"
        value={input.password}
        onChange={(event) => setInput({ ...input, password: event.target.value })}
        error={errors.password}
      />
      <button
        type="button"
        onClick={() => setRecoveryNotice(true)}
        className="ml-auto block min-h-11 text-[13px] text-[var(--color-text)]"
      >
        Forgot Password?
      </button>
      {recoveryNotice ? (
        <p role="status" className="text-sm text-[#d8dadc]">
          Password recovery is not available in this frontend phase.
        </p>
      ) : null}
      {serviceError ? (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {serviceError}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-5 min-h-12 w-[234px] max-w-full rounded-[20px] bg-[#368bfe] px-6 font-[var(--font-display)] text-xl font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
```

- [ ] **Step 6: Create the route**

Create `Alexandria/app/(auth)/login/page.tsx`:

```tsx
import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Log In" };

export default function LoginPage() {
  return (
    <AuthShell>
      <LoginForm />
    </AuthShell>
  );
}
```

- [ ] **Step 7: Run tests and checks**

Run:

```powershell
npm.cmd run test:run -- features/auth/components/login-form.test.tsx
npm.cmd run lint
npm.cmd run build
```

Expected: all PASS.

- [ ] **Step 8: Commit**

```powershell
git add Alexandria/features/auth Alexandria/app/'(auth)'/login
git commit -m "feat: add complete mock-backed login page"
```

---

### Task 6: Implement The Contract-Complete Sign-Up Page

**Owner:** Frontend agent; designer approves the extra field row

**Files:**
- Create: `Alexandria/features/auth/components/sign-up-form.test.tsx`
- Create: `Alexandria/features/auth/components/sign-up-form.tsx`
- Create: `Alexandria/app/(auth)/sign-up/page.tsx`

- [ ] **Step 1: Write failing sign-up tests**

Create `Alexandria/features/auth/components/sign-up-form.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { AuthGateway } from "../lib/auth-gateway";
import { SignUpForm } from "./sign-up-form";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

function makeGateway(): AuthGateway {
  return {
    login: vi.fn(),
    registerMember: vi.fn(),
  };
}

async function fillValidForm() {
  await userEvent.type(screen.getByLabelText("Full name"), "Jane Doe");
  await userEvent.type(screen.getByLabelText("Student email"), "jane@usc.edu.ph");
  await userEvent.type(screen.getByLabelText("USC ID"), "12345678");
  await userEvent.selectOptions(screen.getByLabelText("Affiliation"), "student");
  await userEvent.type(screen.getByLabelText("Password", { exact: true }), "password");
  await userEvent.type(screen.getByLabelText("Confirm password"), "password");
}

describe("SignUpForm", () => {
  it("renders every RegisterPayload field", () => {
    render(<SignUpForm gateway={makeGateway()} />);
    expect(screen.getByLabelText("Full name")).toBeVisible();
    expect(screen.getByLabelText("Student email")).toBeVisible();
    expect(screen.getByLabelText("USC ID")).toBeVisible();
    expect(screen.getByLabelText("Affiliation")).toBeVisible();
    expect(screen.getByLabelText("Password", { exact: true })).toBeVisible();
    expect(screen.getByLabelText("Confirm password")).toBeVisible();
  });

  it("does not submit when passwords differ", async () => {
    const gateway = makeGateway();
    render(<SignUpForm gateway={gateway} />);
    await fillValidForm();
    await userEvent.clear(screen.getByLabelText("Confirm password"));
    await userEvent.type(screen.getByLabelText("Confirm password"), "different");
    await userEvent.click(screen.getByRole("button", { name: "Create Account" }));
    expect(screen.getByText("Passwords do not match.")).toBeVisible();
    expect(gateway.registerMember).not.toHaveBeenCalled();
  });

  it("normalizes the form into RegisterPayload and redirects", async () => {
    const gateway = makeGateway();
    vi.mocked(gateway.registerMember).mockResolvedValue({
      data: { id: "1" },
      error: null,
    });
    render(<SignUpForm gateway={gateway} />);
    await fillValidForm();
    await userEvent.click(screen.getByRole("button", { name: "Create Account" }));
    expect(gateway.registerMember).toHaveBeenCalledWith({
      email: "jane@usc.edu.ph",
      password: "password",
      profile_name: "Jane Doe",
      usc_id: 12345678,
      affiliation: "student",
    });
    expect(push).toHaveBeenCalledWith("/login?registered=1");
  });

  it("maps INVALID_EMAIL_DOMAIN to the email field", async () => {
    const gateway = makeGateway();
    vi.mocked(gateway.registerMember).mockResolvedValue({
      data: null,
      error: {
        code: "INVALID_EMAIL_DOMAIN",
        message: "Use a USC email.",
      },
    });
    render(<SignUpForm gateway={gateway} />);
    await fillValidForm();
    await userEvent.click(screen.getByRole("button", { name: "Create Account" }));
    expect(screen.getByText("Use a USC email.")).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the test to verify failure**

Run:

```powershell
npm.cmd run test:run -- features/auth/components/sign-up-form.test.tsx
```

Expected: FAIL because `SignUpForm` does not exist.

- [ ] **Step 3: Implement the sign-up form**

Create `Alexandria/features/auth/components/sign-up-form.tsx`:

```tsx
"use client";

import { GraduationCap, IdCard, Mail, User } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useState } from "react";
import type {
  FieldErrors,
  RegistrationFormInput,
  RegisterPayload,
} from "../lib/auth-contract";
import { authGateway, type AuthGateway } from "../lib/auth-gateway";
import { validateRegistrationInput } from "../lib/auth-validation";
import { AuthField } from "./auth-field";
import { AuthTabs } from "./auth-tabs";
import { PasswordField } from "./password-field";

const initialInput: RegistrationFormInput = {
  profile_name: "",
  email: "",
  usc_id: "",
  affiliation: "",
  password: "",
  confirm_password: "",
};

export function SignUpForm({
  gateway = authGateway,
}: {
  gateway?: AuthGateway;
}) {
  const router = useRouter();
  const [input, setInput] = useState(initialInput);
  const [errors, setErrors] =
    useState<FieldErrors<RegistrationFormInput>>({});
  const [serviceError, setServiceError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateRegistrationInput(input);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const payload: RegisterPayload = {
      profile_name: input.profile_name.trim(),
      email: input.email.trim().toLowerCase(),
      usc_id: Number(input.usc_id),
      affiliation: input.affiliation as RegisterPayload["affiliation"],
      password: input.password,
    };

    setErrors({});
    setServiceError("");
    setPending(true);
    const result = await gateway.registerMember(payload);
    setPending(false);

    if (result.error) {
      if (result.error.code === "INVALID_EMAIL_DOMAIN") {
        setErrors({ email: result.error.message });
      } else {
        setServiceError(result.error.message);
      }
      return;
    }

    router.push("/login?registered=1");
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <AuthTabs active="sign-up" />
      <AuthField
        id="sign-up-name"
        label="Full name"
        name="profile_name"
        autoComplete="name"
        placeholder="Enter your full name"
        value={input.profile_name}
        onChange={(event) =>
          setInput({ ...input, profile_name: event.target.value })
        }
        icon={<User size={28} />}
        error={errors.profile_name}
      />
      <AuthField
        id="sign-up-email"
        label="Student email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="Enter your student email"
        value={input.email}
        onChange={(event) => setInput({ ...input, email: event.target.value })}
        icon={<Mail size={28} />}
        error={errors.email}
      />
      <div className="grid grid-cols-2 gap-3 max-[600px]:grid-cols-1">
        <AuthField
          id="sign-up-usc-id"
          label="USC ID"
          name="usc_id"
          inputMode="numeric"
          placeholder="USC ID"
          value={input.usc_id}
          onChange={(event) => setInput({ ...input, usc_id: event.target.value })}
          icon={<IdCard size={26} />}
          error={errors.usc_id}
        />
        <div>
          <label htmlFor="sign-up-affiliation" className="sr-only">
            Affiliation
          </label>
          <div className="relative">
            <select
              id="sign-up-affiliation"
              name="affiliation"
              value={input.affiliation}
              onChange={(event) =>
                setInput({
                  ...input,
                  affiliation: event.target.value as RegistrationFormInput["affiliation"],
                })
              }
              aria-invalid={Boolean(errors.affiliation)}
              className="h-[60px] w-full appearance-none rounded-[20px] border border-[#368bfe] bg-[var(--color-bg)] px-5 pr-12 text-[var(--color-text)]"
            >
              <option value="">Affiliation</option>
              <option value="student">Student</option>
              <option value="alumni">Alumni</option>
              <option value="professor">Professor</option>
            </select>
            <GraduationCap
              aria-hidden
              size={26}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#565758]"
            />
          </div>
          {errors.affiliation ? (
            <p className="mt-1 px-2 text-sm text-[#ff6b6b]">
              {errors.affiliation}
            </p>
          ) : null}
        </div>
      </div>
      <PasswordField
        id="sign-up-password"
        label="Password"
        name="password"
        autoComplete="new-password"
        placeholder="Password"
        value={input.password}
        onChange={(event) => setInput({ ...input, password: event.target.value })}
        error={errors.password}
      />
      <PasswordField
        id="sign-up-confirm-password"
        label="Confirm password"
        name="confirm_password"
        autoComplete="new-password"
        placeholder="Confirm Password"
        value={input.confirm_password}
        onChange={(event) =>
          setInput({ ...input, confirm_password: event.target.value })
        }
        error={errors.confirm_password}
      />
      {serviceError ? (
        <p role="alert" className="text-sm text-[var(--color-danger)]">
          {serviceError}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="mt-5 min-h-12 w-[234px] max-w-full rounded-[20px] bg-[#368bfe] px-6 font-[var(--font-display)] text-xl font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Creating account..." : "Create Account"}
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Create the route**

Create `Alexandria/app/(auth)/sign-up/page.tsx`:

```tsx
import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { SignUpForm } from "@/features/auth/components/sign-up-form";

export const metadata: Metadata = { title: "Sign Up" };

export default function SignUpPage() {
  return (
    <AuthShell>
      <SignUpForm />
    </AuthShell>
  );
}
```

- [ ] **Step 5: Run tests and checks**

Run:

```powershell
npm.cmd run test:run -- features/auth/components/sign-up-form.test.tsx
npm.cmd run lint
npm.cmd run build
```

Expected: all PASS.

- [ ] **Step 6: Designer review gate**

Capture `/sign-up` at `1440x1024` and `390x844`. The designer checks:

- the extra USC ID/Affiliation row feels native to the Figma form;
- the Create Account button remains above the desktop fold;
- the mobile form stacks without horizontal overflow;
- error messages do not shift or overlap the orbit artwork.

Do not approve Playwright visual baselines until this gate passes.

- [ ] **Step 7: Commit**

```powershell
git add Alexandria/features/auth/components/sign-up-form* Alexandria/app/'(auth)'/sign-up
git commit -m "feat: add contract-complete sign-up page"
```

---

### Task 7: Add Browser Workflow And Accessibility Coverage

**Owner:** Frontend agent

**Files:**
- Create: `Alexandria/e2e/auth.spec.ts`

- [ ] **Step 1: Write the browser workflow tests**

Create `Alexandria/e2e/auth.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test("switches between login and sign-up", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("link", { name: "Sign Up" }).click();
  await expect(page).toHaveURL("/sign-up");
  await expect(page.getByRole("button", { name: "Create Account" })).toBeVisible();
});

test("shows login validation and mock failure", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByText("Use your @usc.edu.ph email address.")).toBeVisible();

  await page.getByLabel("Student email").fill("error@usc.edu.ph");
  await page.getByLabel("Password").fill("password");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "The email or password is incorrect.",
  );
});

test("completes mock registration", async ({ page }) => {
  await page.goto("/sign-up");
  await page.getByLabel("Full name").fill("Jane Doe");
  await page.getByLabel("Student email").fill("jane@usc.edu.ph");
  await page.getByLabel("USC ID").fill("12345678");
  await page.getByLabel("Affiliation").selectOption("student");
  await page.getByLabel("Password", { exact: true }).fill("password");
  await page.getByLabel("Confirm password").fill("password");
  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(page).toHaveURL("/login?registered=1");
});
```

- [ ] **Step 2: Add a registration success announcement**

Replace `Alexandria/app/(auth)/login/page.tsx` with:

```tsx
import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = { title: "Log In" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const { registered } = await searchParams;
  return (
    <AuthShell>
      <LoginForm registered={registered === "1"} />
    </AuthShell>
  );
}
```

`LoginForm` already renders this exact status when `registered` is true:

```tsx
<p role="status" className="text-sm text-[var(--color-success)]">
  Account created. Log in with your USC email.
</p>
```

- [ ] **Step 3: Run browser tests**

Run:

```powershell
npm.cmd run test:e2e -- --project=desktop-chromium
npm.cmd run test:e2e -- --project=mobile-chromium
```

Expected: all tests PASS.

- [ ] **Step 4: Run the full frontend gate**

Run:

```powershell
npm.cmd run test:run
npm.cmd run lint
npm.cmd run build
```

Expected: all commands PASS.

- [ ] **Step 5: Commit**

```powershell
git add Alexandria/e2e/auth.spec.ts Alexandria/app/'(auth)'/login Alexandria/features/auth/components/login-form.tsx
git commit -m "test: cover auth frontend workflows"
```

---

### Task 8: Lock Screenshot Integrity

**Owner:** Designer agent and frontend agent; orchestrator records approval

**Files:**
- Create: `Alexandria/e2e/auth.visual.spec.ts`
- Add generated snapshots under Playwright's platform-specific snapshot folder

- [ ] **Step 1: Confirm reference images exist**

Verify:

```powershell
Test-Path '..\docs\design-references\auth\login-1440x1024.png'
Test-Path '..\docs\design-references\auth\sign-up-1440x1024.png'
```

Expected: both commands return `True`.

- [ ] **Step 2: Add stable screenshot tests**

Create `Alexandria/e2e/auth.visual.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

for (const route of ["login", "sign-up"] as const) {
  test(`${route} desktop visual`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1024 });
    await page.goto(`/${route}`);
    await page.evaluate(() => {
      window.localStorage.setItem("alexandria-theme", "dark");
      document.documentElement.dataset.theme = "dark";
    });
    await page.reload();
    await expect(page).toHaveScreenshot(`${route}-1440x1024.png`, {
      animations: "disabled",
      maxDiffPixelRatio: 0.01,
    });
  });

  test(`${route} mobile visual`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${route}`);
    await expect(page).toHaveScreenshot(`${route}-390x844.png`, {
      animations: "disabled",
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });
}
```

- [ ] **Step 3: Generate baselines only after designer approval**

Run:

```powershell
npm.cmd run test:e2e:update
```

Expected: four baseline screenshots are created.

- [ ] **Step 4: Compare references and implementation**

The designer must check:

- brand hierarchy and line breaks;
- form dimensions and vertical rhythm;
- orbit placement and clipping;
- icon weight and alignment;
- default theme;
- added sign-up contract row;
- no text clipping at 100%, 125%, and 200% browser zoom.

- [ ] **Step 5: Run visual tests without updating**

Run:

```powershell
npm.cmd run test:e2e -- e2e/auth.visual.spec.ts
```

Expected: all screenshot tests PASS without creating new baselines.

- [ ] **Step 6: Commit**

```powershell
git add Alexandria/e2e/auth.visual.spec.ts Alexandria/e2e/auth.visual.spec.ts-snapshots
git commit -m "test: lock auth visual integrity"
```

At this point Phase A is complete and can be demonstrated without a backend.

---

### Task 9: Add The Backend Service Adapter

**Owner:** Backend agent, after the frontend gate passes

**Files:**
- Create: `Alexandria/features/auth/lib/service-auth-gateway.ts`
- Modify: `Alexandria/features/auth/lib/auth-gateway.ts`
- Backend-owned: `Alexandria/lib/services/auth-service.ts`
- Backend-owned: `Alexandria/lib/services/types.ts`

- [ ] **Step 1: Verify backend signatures**

Confirm these exports exist exactly:

```ts
export async function login(
  email: string,
  password: string,
): Promise<ServiceResult<CurrentUser>>;

export async function registerMember(
  payload: RegisterPayload,
): Promise<ServiceResult<{ id: string }>>;
```

Also confirm `RegisterPayload` contains `email`, `password`, `profile_name`, `usc_id`, and `affiliation`.

- [ ] **Step 2: Write an adapter contract test**

Create `Alexandria/features/auth/lib/service-auth-gateway.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { login, registerMember } from "@/lib/services/auth-service";
import { serviceAuthGateway } from "./service-auth-gateway";

vi.mock("@/lib/services/auth-service", () => ({
  login: vi.fn(),
  registerMember: vi.fn(),
}));

describe("serviceAuthGateway", () => {
  beforeEach(() => vi.clearAllMocks());

  it("forwards login credentials unchanged", async () => {
    vi.mocked(login).mockResolvedValue({
      data: {
        id: "1",
        email: "jane@usc.edu.ph",
        profile_name: "Jane Doe",
        usc_id: 12345678,
        role: "member",
        affiliation: "student",
      },
      error: null,
    });
    await serviceAuthGateway.login("jane@usc.edu.ph", "password");
    expect(login).toHaveBeenCalledWith("jane@usc.edu.ph", "password");
  });

  it("forwards the complete registration payload unchanged", async () => {
    vi.mocked(registerMember).mockResolvedValue({
      data: { id: "1" },
      error: null,
    });
    const payload = {
      email: "jane@usc.edu.ph",
      password: "password",
      profile_name: "Jane Doe",
      usc_id: 12345678,
      affiliation: "student" as const,
    };
    await serviceAuthGateway.registerMember(payload);
    expect(registerMember).toHaveBeenCalledWith(payload);
  });
});
```

- [ ] **Step 3: Run the test to verify failure**

Run:

```powershell
npm.cmd run test:run -- features/auth/lib/service-auth-gateway.test.ts
```

Expected: FAIL because the adapter does not exist.

- [ ] **Step 4: Implement the adapter**

Create `Alexandria/features/auth/lib/service-auth-gateway.ts`:

```ts
import {
  login,
  registerMember,
} from "@/lib/services/auth-service";
import type { AuthGateway } from "./auth-gateway";

export const serviceAuthGateway: AuthGateway = {
  login,
  registerMember,
};
```

- [ ] **Step 5: Switch the gateway binding**

Modify `Alexandria/features/auth/lib/auth-gateway.ts`:

```ts
import { serviceAuthGateway } from "./service-auth-gateway";

export const authGateway: AuthGateway = serviceAuthGateway;
```

Do not change either form component.

- [ ] **Step 6: Run contract and UI tests**

Run:

```powershell
npm.cmd run test:run
npm.cmd run lint
npm.cmd run build
```

Expected: all PASS.

- [ ] **Step 7: Commit**

```powershell
git add Alexandria/features/auth/lib Alexandria/lib/services Alexandria/lib/supabase
git commit -m "feat: connect auth pages to service layer"
```

---

### Task 10: Verify Real Authentication And Finalize The Handoff

**Owner:** Backend agent and orchestrator

**Files:**
- No design-file changes
- Environment values remain local and uncommitted

- [ ] **Step 1: Start the application**

Run from `Alexandria/`:

```powershell
npm.cmd run dev -- --hostname 127.0.0.1
```

Expected: Next.js reports a local URL and both `/login` and `/sign-up` load.

- [ ] **Step 2: Smoke-test registration**

Use a permitted test account and verify:

1. A non-USC email is blocked before the service call.
2. A valid `@usc.edu.ph` account submits all five `RegisterPayload` fields.
3. Successful registration reaches `/login?registered=1`.
4. Duplicate-account or Supabase errors appear in the form alert.

- [ ] **Step 3: Smoke-test login and role routing**

Verify:

1. Invalid credentials preserve the email and display an error.
2. A member reaches `/`.
3. An admin reaches `/admin`.
4. A moderator reaches `/moderator`.
5. Refreshing after login preserves the Supabase session.

- [ ] **Step 4: Re-run all automated checks**

Run:

```powershell
npm.cmd run test:run
npm.cmd run test:e2e
npm.cmd run lint
npm.cmd run build
```

Expected: all commands PASS.

- [ ] **Step 5: Orchestrator final review**

Confirm:

- designer approval is recorded for desktop and mobile;
- frontend tests pass in mock mode;
- service adapter tests pass against backend functions;
- no component imports Supabase directly;
- no raw backend error object is rendered;
- no user-owned documentation changes were overwritten;
- the Git worktree contains only intentional auth-plan implementation changes.

- [ ] **Step 6: Commit any final integration-only corrections**

```powershell
git add Alexandria
git commit -m "fix: complete auth integration acceptance"
```

## Deferred From This Slice

- Password reset request, email confirmation, and update-password routes
- Landing, catalog, profile, admin, and moderator page implementation
- Protected-route middleware and role guard layouts
- Social or third-party authentication
- Remember-me behavior

These are excluded because `docs/backend_functions.md` does not define password-recovery functions and the user requested only login/sign-up frontend work plus the existing auth-service linkage.
