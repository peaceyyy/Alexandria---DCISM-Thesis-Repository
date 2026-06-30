# Failure Mode: Auth Services Missing Tests and Dependencies

**Date**: 2026-06-30
**Phase**: Backend Readiness - Auth & Role Guards

## Context
During `/validate` of the backend readiness auth phase, `lib/services/auth-service.ts` and `lib/supabase/*` were verified against `docs/backend_functions.md`, `.agent/protocols/references/code-documentation/nextjs-16-frontend.md`, and the `nextjs-react-expert` skill.

## Failure Mode
1. **Missing Dependencies**: `@supabase/ssr` and `@supabase/supabase-js` were imported and used but never added to `package.json`.
2. **Next.js 16 `cookies()` Async Behavior**: According to the Next.js 16 protocol, data fetching and auth checks properly belong on the server. However, in Next.js 16, `cookies()` returns a Promise. The `lib/supabase/server.ts` file attempts to call `.get()` and `.set()` synchronously on a `Promise<ReadonlyRequestCookies>`, leading to TypeScript errors during compilation.
3. **Missing Tests**: No test files were created for the auth services, violating the Constitution's Test-First rule.

## Cross-Reference Insights (Next.js 16 & Performance)
- **Next.js 16 Frontend Protocol**: The placement of these auth checks on the server aligns perfectly with the protocol ("Keep these on the server: data fetching and authorization checks"). However, the server Supabase client must be updated to `await cookies()` before calling `.get()`, `.set()`, or `.remove()`.
- **Next.js-React-Expert Skill**: We must ensure that future additions to `auth-service.ts` do not introduce server-side waterfalls (Section 3). Currently, `login()` awaits `signInWithPassword()` and then awaits `getCurrentUser()`. This sequential flow is logically necessary for auth, but the server client creation should remain optimized.

## Prevention
- Always run `npm run build` or `npx tsc --noEmit` before handing off code to verify dependencies are installed and types match.
- Strictly adhere to Next.js 16 server component API changes (e.g., `await cookies()`).
- Strictly adhere to the Test-First rule from the Constitution by writing `.test.ts` files alongside service implementations before marking a phase as complete.
