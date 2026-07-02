# Phase 2: Supabase Foundation

**Phase Goal**: Build the database, storage, RLS, indexes, and seed data needed by every MVP flow.

## Phase Metadata

**Phase Type**: Foundation
**Estimated Complexity**: High
**Estimated Time**: 4-6 hours
**Prerequisites**: Phase 1
**Primary Systems Affected**: Database, Storage, Auth metadata, Backend contracts
**Dependencies**: Supabase project, PostgreSQL migrations, Supabase Storage

## Feature Description

This phase gives Alexandria its data foundation. Shane leads schema and policy work while Homer reviews integration impact and query contracts. The database must support public metadata discovery, protected PDF access, draft/publish/archive workflows, ordered authors, tags, recommendations, and lessons learned.

## User Impact

**User Story**:
As the implementation team, we want a reliable Supabase foundation, so that all application features use the same source of truth.

**Value Delivered**:

- Real thesis records can be stored and queried.
- Public metadata and protected PDFs have different access boundaries.
- Seed data lets frontend and backend flows be tested early.

## Context References

| Document | Sections | Why Read |
| --- | --- | --- |
| `.agent/project_specification.md` | Data Model, Access Control, Storage, Database and RLS | Full data requirements |
| `docs/database-engineer-reference.md` | Suggested Conceptual Model, Recommended Tables, RLS, Indexes | Shane's main handoff |
| `docs/design-decision-log.md` | Decisions 001-020 | Accepted product decisions |

## Implementation Tasks

### Task 1: Create Core Tables

**Action**: Create migrations for departments, advisers, research areas, tags, theses, thesis authors, thesis tags, thesis files, recommendations, lessons, profiles, and optional audit logs.
**Files**: Supabase migrations or SQL scripts decided by Shane and Homer.
**Why**: Establishes canonical data storage.
**Verification**: Tables, keys, constraints, and basic inserts work in Supabase.

### Task 2: Add Status, Role, and Publish Constraints

**Action**: Add constraints for thesis statuses and app roles, plus required relational structure for publish validation.
**Files**: Supabase migrations.
**Why**: Prevents invalid statuses and role values from spreading.
**Verification**: Invalid role/status inserts fail; valid seed data inserts successfully.

### Task 3: Configure PDF Storage

**Action**: Configure the public `thesis_files_bucket` for PDF-only uploads up
to 10 MiB and use owner/UUID-based object keys.
**Files**: Supabase Storage configuration plus documentation.
**Why**: Accepted thesis PDFs are public, while upload permissions remain authenticated.
**Verification**: Authenticated submissions can upload valid PDFs; invalid MIME types and oversized files are rejected; public reads work for stored accepted-thesis objects.

### Task 4: Draft RLS Policies

**Action**: Enable RLS and add policies for public accepted metadata reads,
authenticated submission writes, admin/moderator edits, and profile role reads.
**Files**: Supabase policies.
**Why**: Backend checks need database-level defense.
**Verification**: Anonymous users cannot read non-accepted thesis metadata or write storage objects.

### Task 5: Add Query Indexes

**Action**: Add indexes for public browse, year, status, adviser, department, research area, authors, tags, primary files, and admin lists.
**Files**: Supabase migrations.
**Why**: Search and filtering should remain responsive.
**Verification**: Basic query plans use indexes where expected for common filters.

### Task 6: Seed Demo Data

**Action**: Seed DCISM, advisers, research areas, tags, sample published/draft/archived theses, and role profiles.
**Files**: Supabase seed scripts.
**Why**: Frontend and backend integration need realistic data.
**Verification**: Repository list, detail, auth roles, and admin status screens have sample records.

## Exit Criteria

- [ ] Core schema exists.
- [ ] RLS is enabled on application tables.
- [ ] PDF storage bucket exists and blocks anonymous reads.
- [ ] Seed data covers published, draft, and archived records.
- [ ] Homer signs off on query shapes and integration risks.

## What You Will Learn

**Technical Skills**:

- Supabase schema and RLS design.
- Storage policy planning for protected files.

**Conceptual Understanding**:

- Difference between public metadata and protected document access.
- Why database policy should support backend authorization.

**Tools and Patterns**:

- PostgreSQL constraints, indexes, and seed scripts.
- Supabase Auth profile linking.

## Notes and Gotchas

**Common Issues**:

- Do not expose PDFs through a public bucket.
- Do not make Contributor/Admin roles self-assignable.
- Keep recommendations and lessons in separate tables.

**Dependencies**:

- Supabase project credentials.
- Agreement on migration/seed script location.
