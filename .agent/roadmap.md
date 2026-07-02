# Project Roadmap: Alexandria

Generated: 2026-06-24
Source: `.agent/project_specification.md`
Total Phases: 8
Estimated Total Time: 4-6 focused team weeks

## How To Use This Roadmap

Each phase is a conversation boundary and a team checkpoint.

1. Read the phase plan in `.agent/plans/`.
2. Check the matching team overview in `phases/general/roadmap.md`.
3. Each teammate works from their role task board under `phases/<Name>/tasks.md`.
4. Validate the phase before marking it complete.
5. Update docs and commit before starting the next phase.

## Phase Overview

| Phase | Name | Type | Complexity | Time | Prerequisites | Primary Owners | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Project Contracts and Team Workflow | Foundation | Medium | 2-3h | None | Homer | Not Started |
| 2 | Supabase Foundation | Foundation | High | 4-6h | Phase 1 | Shane, Homer | Not Started |
| 3 | Auth and Role Enforcement | Feature | High | 4-6h | Phase 2 | Homer, Ethan | Not Started |
| 4 | Public Repository Backend | Feature | Medium | 4-5h | Phase 2, Phase 3 | Homer, Shane | Not Started |
| 5 | Public Repository Frontend | Feature | High | 4-6h | Phase 1, Phase 4 contract draft | Leira | Not Started |
| 6 | Admin Backend Workflows | Feature | High | 5-7h | Phase 3, Phase 4 | Homer, Shane | Not Started |
| 7 | Admin Frontend Workflows | Feature | High | 5-7h | Phase 3, Phase 6 contract draft | Ethan, Leira | Not Started |
| 8 | Integration QA and Demo Polish | QA | Medium | 4-6h | Phases 1-7 | Homer, All | Not Started |

## Phase Details

### Phase 1: Project Contracts and Team Workflow

Goal: Convert the PRD into stable implementation contracts and team operating rules.

File: `.agent/plans/phase-1-project-contracts-team-workflow.md`
Must Complete Before: Phase 2, Phase 3, frontend build work that depends on payload shapes

Quick Scope:

- Confirm folder conventions, branch/task workflow, and review expectations.
- Draft shared API response shapes and mock payloads.
- Assign role task boards and phase deliverables.
- Create or update environment variable examples without real secrets.

Exit Criteria: Team has agreed contracts, phase task boards are readable, and frontend can start against mock data.

### Phase 2: Supabase Foundation

Goal: Build the database, RLS, storage, and seed-data base that every feature depends on.

File: `.agent/plans/phase-2-supabase-foundation.md`
Must Complete Before: Phase 3, Phase 4, Phase 6

Quick Scope:

- Create core schema and seed data.
- Configure the public, PDF-only, 10 MiB `thesis_files_bucket`.
- Draft RLS policies for published metadata, roles, and admin/contributor work.
- Add indexes for browse, filter, status, author, and tag queries.

Exit Criteria: Supabase project has schema, policies, seeds, and enough sample data for UI integration.

### Phase 3: Auth and Role Enforcement

Goal: Connect Supabase Auth to the Next.js app and enforce Admin, Contributor, and Student visitor roles.

File: `.agent/plans/phase-3-auth-role-enforcement.md`
Must Complete Before: Protected contribution and admin workflows

Quick Scope:

- Add Supabase SSR/browser client helpers.
- Implement login, signup, callback, logout, and `/api/me`.
- Enforce `usc.edu.ph` student visitor registration.
- Add role checks for protected routes and server operations.

Exit Criteria: Anonymous, Student visitor, Contributor, and Admin states are distinguishable and enforced.

### Phase 4: Public Repository Backend

Goal: Provide stable public repository API contracts for browse, search, detail, PDF access, and related theses.

File: `.agent/plans/phase-4-public-repository-backend.md`
Must Complete Before: Full public frontend integration

Quick Scope:

- Implement public thesis listing with search, filters, sorting, and pagination.
- Implement thesis detail payloads with recommendations, lessons, and related theses.
- Implement the public accepted-thesis file route or equivalent redirect.
- Shape responses so the frontend does not need raw Supabase join details.

Exit Criteria: Public API contracts return real or seeded data and expose accepted-thesis PDFs without leaking storage URLs in thesis DTOs.

### Phase 5: Public Repository Frontend

Goal: Build the student-facing repository browse, search, detail, and PDF-access experience.

File: `.agent/plans/phase-5-public-repository-frontend.md`
Must Complete Before: Final QA and demo polish

Quick Scope:

- Build repository page, thesis cards, filters, sorting, and empty/error/loading states.
- Build thesis detail page with metadata, recommendations, lessons, related theses, and PDF controls.
- Use agreed mock payloads first, then connect live endpoints.
- Keep accepted PDF access public while contribution controls remain authenticated.

Exit Criteria: Students can discover a relevant thesis quickly and understand its usefulness.

### Phase 6: Admin Backend Workflows

Goal: Implement draft, upload, edit, publish, archive, and soft-delete backend workflows.

File: `.agent/plans/phase-6-admin-backend-workflows.md`
Must Complete Before: Full admin frontend integration

Quick Scope:

- Implement admin thesis list, create, update, file register/replace, publish, archive, and soft delete endpoints.
- Centralize publish validation.
- Preserve PDF replacement metadata and primary-file switching.
- Add audit-friendly metadata where practical.

Exit Criteria: Admin/Contributor operations work through server contracts and cannot expose incomplete records publicly.

### Phase 7: Admin Frontend Workflows

Goal: Build the dashboard and editor experience for managing thesis records.

File: `.agent/plans/phase-7-admin-frontend-workflows.md`
Must Complete Before: Final QA and demo polish

Quick Scope:

- Build admin dashboard with status filtering and quick actions.
- Build thesis editor for metadata, authors, tags, recommendations, lessons, and publish readiness.
- Build PDF upload/replacement panel.
- Show validation, unauthorized, loading, empty, and success states.

Exit Criteria: Admins can prepare and publish a complete thesis without direct database editing.

### Phase 8: Integration QA and Demo Polish

Goal: Stabilize the full MVP for presentation, handoff, and defense/demo usage.

File: `.agent/plans/phase-8-integration-qa-demo-polish.md`
Must Complete Before: MVP presentation or deployment

Quick Scope:

- Run lint/build and phase validation.
- Perform role-based manual QA.
- Finalize seed/demo data and documentation.
- Prepare demo script and known-limits list.

Exit Criteria: The MVP is demonstrable end to end with documented setup and known constraints.

## Progress Tracking

Completed Phases: 0/8
Current Phase: Phase 1
Last Updated: 2026-06-24

| Phase | Completed Date | Actual Time | Notes |
| --- | --- | --- | --- |
| Phase 1 | - | - | - |
| Phase 2 | - | - | - |
| Phase 3 | - | - | - |
| Phase 4 | - | - | - |
| Phase 5 | - | - | - |
| Phase 6 | - | - | - |
| Phase 7 | - | - | - |
| Phase 8 | - | - | - |

## Dependency Graph

```text
Phase 1 Project Contracts
  |
Phase 2 Supabase Foundation
  |
Phase 3 Auth and Role Enforcement
  |
+------------------------------+
|                              |
Phase 4 Public Backend         Phase 6 Admin Backend
  |                              |
Phase 5 Public Frontend        Phase 7 Admin Frontend
  \                              /
   +---- Phase 8 Integration QA ----+
```

## Learning Path

By completing this roadmap, the team will practice:

- Product-to-contract translation for a real web app.
- Supabase schema, RLS, Auth, and Storage integration.
- Next.js server-side auth and route-handler patterns.
- Frontend work against typed API contracts and mock payloads.
- Role-based testing and demo-ready project management.
