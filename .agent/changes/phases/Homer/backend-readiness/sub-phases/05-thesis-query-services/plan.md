# Sub-phase 05: Public Thesis Query Services

Owner: Homer
Shared with: Leira
Mode: Planning first, implementation later

## Goal

Plan the public thesis services that Leira's repository and detail pages will call.

## Service Functions

- `ThesisService.getAll({ q, year, department, research_area, page, limit })`
- `ThesisService.getById(id)`
- `ThesisService.getFilters()`
- optional `ThesisService.getRelated(thesisId)` if related-thesis logic moves backend-side later

## Query Rules

- Public list/detail only shows `review_status = 'accepted'`.
- Sort default is `year DESC`.
- Search should cover title, abstract, tags, and `thesis_authors.display_name`.
- Filters come from accepted records.
- Public detail returns `file_access`, not raw `file_url`.

## Shane-Shared Note

Shane may need to add indexes for common filters/searches. Homer can add simple indexes if Shane asks or is unavailable, but Shane should review performance-sensitive DB work.

## Exit Criteria

- Leira can wire repository cards to `ThesisCard`.
- Leira can wire detail page to `ThesisDetail`.
- Public services never expose non-accepted theses or raw file URLs.

