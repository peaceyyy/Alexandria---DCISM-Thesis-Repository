# Phase 4: Public Repository Backend

**Phase Goal**: Provide stable server contracts for public thesis discovery, detail pages, related theses, and protected PDF access.

## Phase Metadata

**Phase Type**: Feature
**Estimated Complexity**: Medium
**Estimated Time**: 4-5 hours
**Prerequisites**: Phase 2, Phase 3
**Primary Systems Affected**: Backend integration, Database queries, Storage access
**Dependencies**: Supabase schema, RLS, seeded thesis data, auth helpers

## Feature Description

This phase turns the database into frontend-ready API contracts. Homer leads route handlers/data shaping. Shane supports query tuning and relationship fixes. Leira and Ethan use the contracts to connect UI work without coupling directly to raw database joins.

## User Impact

**User Story**:
As a student, I want to search and inspect theses, so that I can quickly decide which previous work is relevant.

**Value Delivered**:

- Published thesis cards are listable and searchable.
- Detail pages receive complete metadata and knowledge-transfer content.
- PDF access is available only to authenticated users.

## Context References

| Document | Sections | Why Read |
| --- | --- | --- |
| `.agent/project_specification.md` | API and Server Contracts, Search, Storage | Required API behavior |
| `docs/database-engineer-reference.md` | Query Patterns To Support | Database query needs |
| `docs/Alexandria PRD.md` | Repository and Discovery, Detail View, PDF Access | User-facing behavior |

## Implementation Tasks

### Task 1: Implement Thesis List Contract

**Action**: Build `GET /api/theses` with pagination, keyword search, filters, and default newest-year sorting.
**Files**: Recommended: `Alexandria/app/api/theses/route.ts`, backend query helpers.
**Why**: Powers the public repository page.
**Verification**: Returns only published, non-deleted records.

### Task 2: Implement Thesis Detail Contract

**Action**: Build `GET /api/theses/:slug` or equivalent dynamic route with full public metadata.
**Files**: Recommended: `Alexandria/app/api/theses/[slug]/route.ts`
**Why**: Powers the thesis detail page.
**Verification**: Includes authors, adviser, department, research area, tags, recommendations, lessons, optional links/awards/conferences, related theses, and PDF access state.

### Task 3: Implement Related Thesis Query

**Action**: Compute related theses from shared tags and/or research area, excluding the current thesis.
**Files**: Backend query helper.
**Why**: Required MVP discovery feature.
**Verification**: Detail payload includes reasonable related thesis cards for seeded data.

### Task 4: Implement Public PDF File Contract

**Action**: Build `GET /api/theses/:id/file` to stream or redirect to the current primary PDF for an accepted thesis.
**Files**: Recommended route handler plus storage helper.
**Why**: Keeps storage-provider URLs out of thesis DTOs while accepted PDFs remain public.
**Verification**: Anonymous requests for accepted theses succeed; non-accepted thesis files remain unavailable through the public route.

### Task 5: Add Structured Errors

**Action**: Standardize validation, unauthorized, forbidden, not found, and storage failure responses.
**Files**: Recommended: `Alexandria/app/lib/errors/*`
**Why**: Frontend can show consistent states.
**Verification**: Each route returns predictable status and JSON shape.

## Exit Criteria

- [ ] Public list endpoint supports search, filters, sorting, and pagination.
- [ ] Detail endpoint includes all required metadata sections.
- [ ] Related theses are dynamic.
- [ ] PDF URL endpoint enforces authentication.
- [ ] Responses are stable enough for frontend integration.

## What You Will Learn

**Technical Skills**:

- Supabase relational queries and response shaping.
- Authenticated storage URL generation.

**Conceptual Understanding**:

- How to keep frontend independent from raw database joins.
- Why public metadata and protected files need separate contracts.

**Tools and Patterns**:

- Next.js route handlers.
- Centralized query and error helpers.

## Notes and Gotchas

**Common Issues**:

- Do not return draft or archived records in public endpoints.
- Do not return storage keys or signed URLs to anonymous users.
- Keep recommendations and lessons clearly separate in the response.

**Dependencies**:

- Seeded data from Phase 2.
- Auth helpers from Phase 3.
