# Mockup Contract Review

Reviewed: 2026-06-27
Owner: Homer
Screens reviewed: main repository page, thesis preview/detail page

## Purpose

This note maps the current frontend mockups to the locked API/service contract. Leira and Ethan are still designing mockups, so this is not an implementation checklist yet. It is the data contract guardrail for when mockups become components.

## Main Repository Page

Visible UI needs:

- Search query input.
- Year range filter with `from` and `to` values.
- Category/research-area filter options.
- Adviser filter options.
- Department filter options.
- Tag selector.
- Repeated thesis cards with:
  - authors display text
  - year
  - title
  - abstract preview
  - tags

Contract coverage:

- `ThesisService.getAll({ q, year, department, research_area, page, limit })` covers the visible list flow.
- `ThesisCard` covers `id`, `title`, `authors`, `year`, `abstract_preview`, `tags`, and `research_area`.
- `FilterOptions` covers `research_areas`, `departments`, and `years`.

Contract notes to keep visible:

- The mockup shows a year range, while the current contract has a single `year` filter. If the final UI keeps From/To, update the contract to `year_from` and `year_to` before implementation.
- The mockup labels the category filter separately from tags. In the current data model, this should map to `research_area`, not `tags`.
- Adviser filtering is visible in the mockup, but `FilterOptions` currently does not include `advisers`. Add it before implementation if the adviser filter remains in the final UI.

## Thesis Preview / Detail Page

Visible UI needs:

- Back navigation.
- Title.
- Authors.
- Year.
- Abstract.
- Keywords/tags.
- Embedded PDF preview.
- Lessons learned panel.
- Research-area/category chips.
- Recommended/related articles list.

Contract coverage:

- `ThesisService.getById(id)` covers the selected thesis flow.
- `ThesisDetail` covers title, authors, abstract, year, tags, research area, lessons learned, file access, and related theses.
- `file_access.download_path` is the correct frontend field for PDF preview/download. The raw `thesis_files.file_url` must not be exposed.
- `related_theses: ThesisCard[]` covers the recommended articles list.

Contract notes to keep visible:

- The mockup shows "Lessons Learned" but does not visibly show "Recommendations." The contract includes both. If the final detail page hides recommendations, Homer should confirm whether the field is still required for acceptance but displayed elsewhere.
- The mockup uses "Recommended Articles"; the contract calls this `related_theses`. Keep the UI label flexible, but keep the data contract named `related_theses` unless the team intentionally renames it.
- The PDF preview should use `file_access.has_primary_file`, `file_access.requires_auth`, and `file_access.download_path`. Do not design components around a raw PDF URL.

## Phase 1 Follow-Up Questions

Ask these before frontend implementation starts:

1. Will the final main page keep year range filtering, or should it be a single year filter?
2. Will adviser filtering stay in the final sidebar?
3. Will the thesis detail page display `recommendations`, or only `lessons_learned`?

## Current Recommendation

Do not start service implementation solely because mockups exist. First, answer the three follow-up questions above, then patch `docs/api-contracts.md` if needed. After that, move to sub-phase 03 and create `Alexandria/lib/services/types.ts` and `Alexandria/lib/services/result.ts`.
