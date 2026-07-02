# Phase 5: Public Repository Frontend

**Phase Goal**: Build the student-facing thesis repository browsing, search, detail, and PDF access experience.

## Phase Metadata

**Phase Type**: Feature
**Estimated Complexity**: High
**Estimated Time**: 4-6 hours
**Prerequisites**: Phase 1, Phase 4 contract draft
**Primary Systems Affected**: Frontend, Public UX, Auth-aware UI states
**Dependencies**: API mock payloads or live `GET /api/theses`, detail, and public file contracts

## Feature Description

This phase is Leira's main public-facing build. The goal is not a landing page. The first screen should be the usable repository experience: search, filters, thesis cards, sorting, and clear navigation to detail pages. Ethan supports auth/PDF states where needed, while Homer keeps contracts stable.

## User Impact

**User Story**:
As a student, I want to browse, search, and inspect thesis records, so that I can find useful prior work quickly.

**Value Delivered**:

- Students can scan thesis cards and filter results.
- Detail pages explain relevance through metadata, recommendations, and lessons.
- PDF controls clearly show whether login is required.

## Context References

| Document | Sections | Why Read |
| --- | --- | --- |
| `.agent/project_specification.md` | Frontend Requirements, Search, API Contracts | Page behavior |
| `docs/Alexandria PRD.md` | Repository, Search, Detail View | User-facing requirements |
| `Alexandria/AGENTS.md` | All | Next.js version warning before coding |

## Implementation Tasks

### Task 1: Build Repository Browse Page

**Action**: Build the main repository page with search input, result count, thesis cards, filters, sort, pagination or load-more behavior.
**Files**: `Alexandria/app/*` paths chosen by the frontend team.
**Why**: This is the main student workflow.
**Verification**: Seeded or mock thesis cards render with loading, empty, and error states.

### Task 2: Build Thesis Card Components

**Action**: Create reusable thesis card/list components with title, authors, year, abstract preview, tags, and research area.
**Files**: Frontend component files.
**Why**: Cards are reused in search results and related thesis sections.
**Verification**: Cards fit responsive layouts and do not overflow with long titles/tags.

### Task 3: Build Filter and Sort Controls

**Action**: Implement research area, adviser, department, year, and sort controls.
**Files**: Frontend component files and URL/query state helpers.
**Why**: Discovery requires search plus filters plus sort.
**Verification**: Changing controls updates the query state and result request.

### Task 4: Build Thesis Detail Page

**Action**: Display complete metadata, authors, abstract, tags, adviser, department, research area, recommendations, lessons learned, related theses, and optional links.
**Files**: Dynamic detail route and components.
**Why**: Students need enough context to decide relevance.
**Verification**: Recommendations and lessons are visually distinct and both render when present.

### Task 5: Build PDF Access UI States

**Action**: Show login prompt for anonymous users and preview/download controls for authenticated users.
**Files**: Detail page PDF section.
**Why**: PDF access is the protected boundary.
**Verification**: Anonymous UI never exposes a download URL; authenticated UI can request one.

## Exit Criteria

- [ ] Repository page is usable as the first screen.
- [ ] Search/filter/sort controls work against mocks or live API.
- [ ] Detail page includes recommendations, lessons, and related theses.
- [ ] PDF controls are auth-aware.
- [ ] Mobile and desktop layouts are readable.

## What You Will Learn

**Technical Skills**:

- Building searchable Next.js interfaces.
- Managing loading, empty, error, and unauthorized states.

**Conceptual Understanding**:

- Discovery UX for academic repositories.
- Difference between public metadata and protected assets.

**Tools and Patterns**:

- Component composition.
- Query-state-driven filtering.

## Notes and Gotchas

**Common Issues**:

- Avoid making a marketing landing page as the MVP first screen.
- Do not hide full published metadata behind login.
- Long thesis titles and tags must not break card layout.

**Dependencies**:

- Mock payloads from Phase 1 or live backend from Phase 4.
