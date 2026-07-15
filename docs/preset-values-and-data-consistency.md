# Preset Values and Data Consistency Guide

Last updated: 2026-07-15

Status: implemented policy source of truth.

## Purpose

Alexandria currently has several metadata values repeated across upload forms, browse filters, admin mock data, review pages, services, and project documentation. Some of those repeated values disagree with each other.

This guide organizes the agreed preset values so future implementation can remove inconsistencies without guessing at the intended product vocabulary.

## Consistency Rules

1. Store canonical values and display the same clear, controlled labels.
   - Example: store and display `CS`, `IT`, or `IS`.

2. Keep the DCISM repository scope separate from its program classifications.
   - Alexandria is for DCISM work; `CS`, `IT`, and `IS` classify each submitted record.

3. Use one preset source in code.
   - Upload forms, browse filters, admin pages, review pages, mock data, and seed data should consume the same preset source.

4. Keep broad categories separate from tags.
   - Research areas are curated, reusable filters.
   - Tags are flexible keywords contributed per thesis.

5. Keep required/optional rules consistent across upload, review, detail, docs, and backend contracts.
   - If a field is required during upload, it should also appear in review/approval surfaces.
   - If a field is optional in the database contract, the upload form should not silently make it mandatory unless that is an intentional product decision.

## Canonical Preset Families

### Department

Meaning: the DCISM academic program classification for a thesis/capstone record.

MVP decision:

Alexandria is a DCISM repository. For this MVP, the only enabled, valid, and submitted department values are `CS`, `IT`, and `IS`.

MVP canonical value:

| Stored value | Display label | Notes |
| --- | --- | --- |
| `CS` | CS | Computer Science |
| `IT` | IT | Information Technology |
| `IS` | IS | Information Systems |

Department UI rule:

| UI location | Expected treatment |
| --- | --- |
| Upload, correction, and admin edit forms | Select only `CS`, `IT`, or `IS`. |
| Browse and dashboard filters | Offer only `CS`, `IT`, and `IS`. Do not derive choices from stored rows. |
| Review and detail pages | Display the stored code. |
| Legacy data | Remove records holding other values manually in Supabase. No automated migration is planned. |

Invalid department values:

| Invalid value | Why invalid | Recommended handling |
| --- | --- | --- |
| `BSCS` | Legacy course code | Remove or manually correct to `CS`. |
| `BSIT` | Legacy course code | Remove or manually correct to `IT`. |
| `BSIS` | Legacy course code | Remove or manually correct to `IS`. |
| `Computer Science` | Legacy display label | Remove or manually correct to `CS`. |
| `Information Technology` | Legacy display label | Remove or manually correct to `IT`. |
| `Information Systems` | Legacy display label | Remove or manually correct to `IS`. |

Candidate future department values needing official codes/names:

| Candidate | Open decision |
| --- | --- |
| `CpE` | Future-only. Confirm official department name and storage code before enabling. |
| `CE` | Future-only. Confirm official department name and storage code before enabling. |
| `Biology` | Future-only. Confirm official department name and storage code before enabling. |
| `Psychology` | Future-only. Confirm official department name and storage code before enabling. |

Known current drift:

| Location | Current value shape | Problem |
| --- | --- | --- |
| Submission, correction, admin, and staff dashboard filters | `CS`, `IT`, `IS` | Uses the shared controlled vocabulary. |
| Public filter service | `CS`, `IT`, `IS` | Returns the controlled vocabulary rather than values found in stored rows. |
| Legacy Supabase rows | Older department values | Must be cleared manually before relying on department reporting. |

### Research Area

Meaning: a broad research domain used for discovery, filtering, and related-thesis matching. Research area values should be curated. Tags remain flexible.

Current proposed canonical list from the upload schema:

| Stored/display value | Notes |
| --- | --- |
| `AI / Machine Learning` | Prefer this over `AI / ML` for clarity. |
| `Web Development` | Current upload preset. |
| `Mobile Development` | Current upload preset. |
| `Cybersecurity` | Current upload preset. |
| `IoT` | Current upload preset. |
| `Data Science` | Current upload preset. |
| `Networking` | Present in upload schema; needs product confirmation. |
| `Algorithms` | Current upload preset. |
| `Mathematics` | Current upload preset. |

Aliases and cleanup targets:

| Existing value | Recommended action |
| --- | --- |
| `AI / ML` | Replace with `AI / Machine Learning`. |
| `Computer Vision` | Decide whether to add as its own research area or map under `AI / Machine Learning`. |
| `Software Engineering` | Decide whether to add as its own research area or map under `Web Development` or a future `Software Engineering` preset. |
| `Wireless Network` / wireless communication tags | Keep as tags unless the thesis is broadly classified as `Networking`. |

Known current drift:

| Location | Current value shape | Problem |
| --- | --- | --- |
| `docs/Alexandria PRD.md` | Both "free text" and "controlled values" | Product docs contradict themselves. |
| `docs/database-engineer-reference.md` | Free text in DB, frontend-controlled dropdown | This is workable, but must be documented as a deliberate DB-flexible/UI-controlled pattern. |
| `Alexandria/lib/upload/schema.ts` | Controlled list | Good candidate for the initial preset source. |
| `Alexandria/components/layout/filter-sidebar.tsx` | Separate hardcoded list with `AI / ML` | Drift from upload schema. |
| `Alexandria/lib/mock-data/theses.ts` | `AI / ML` and other hardcoded values | Drift from upload schema. |
| `Alexandria/components/admin/mock-data.ts` | `Software Engineering`, `Computer Vision` | Values appear in admin/review data but not upload schema. |

Important modeling decision:

The upload UI currently allows multiple research areas, but the service/database contract stores a singular `research_area` text value. Before implementation, decide whether Alexandria should support:

| Option | Effect |
| --- | --- |
| Single research area per thesis | Keep `research_area` as one text value and make upload single-select. |
| Multiple research areas per thesis | Add a proper multi-value contract instead of joining values into one string. |

### Study Type

Meaning: what kind of academic work the record represents.

| Stored value | Display label |
| --- | --- |
| `thesis` | Thesis |
| `capstone` | Capstone |

Rule: do not use "research", "paper", or "project" as stored study type values unless a future product decision expands the enum.

### Publication and Conference Metadata

Current fields:

| Field | Meaning | Current consistency issue |
| --- | --- | --- |
| `publication_date` | Month and year formally presented or published | Current upload schema uses a full date-shaped field, but the product only needs month/year. |
| `publication_link` | Public URL to proceedings, journal, repository, or official publication | Required in current upload schema, but may not exist for every thesis. |
| `conference` | Conference, symposium, event, or venue where the work was presented | Required in current upload schema, optional in older docs/database notes, and missing from some detail/review surfaces. |

Publication date display rule:

| Surface | Expected treatment |
| --- | --- |
| Upload form | Ask for month and year only. Do not ask users for a day. |
| Upload review step | Show month and year, e.g. `June 2026`. |
| Public thesis detail page | Show month and year with publication metadata. |
| Moderator review/approval detail page | Show month and year as the reviewable publication date. |
| Homepage/repository cards | Show year only, e.g. `2026`, when compact metadata is preferred. |
| Backend/service contract | Preserve month/year meaning even if the storage layer later uses a date-shaped column internally. |

Conference display rule:

If `conference` exists or is required, it should be visible anywhere full thesis metadata is reviewed:

| Surface | Expected treatment |
| --- | --- |
| Upload publication step | Input field. Already present. |
| Upload review step | Summary row. Already present. |
| Public thesis detail page | Display with publication metadata. Currently missing in the mock-driven detail page. |
| Moderator review/approval detail page | Display as a reviewable metadata field. Currently missing from review field keys and review detail metadata. |
| Admin all-studies/published detail pages | Display with other metadata if available. |
| API/service DTOs | Include in thesis detail and review-submission shapes if moderators need to approve it. |

Open decision:

Decide whether `conference` is required for every submission. If not every thesis has a conference, make it optional in upload validation and display `Not provided` or hide the row when empty.

### Review Status

Stored values and labels are already mostly consistent:

| Stored value | Display label |
| --- | --- |
| `for_review` | Pending |
| `flagged` | Flagged |
| `accepted` | Approved |
| `trashed` | Trashed |

Rule: store status keys, not labels. Labels can change without data migration.

### User Role and Affiliation

These are not the main inconsistency reported here, but they are existing presets and should remain centralized with the same pattern.

Roles:

| Stored value | Display label |
| --- | --- |
| `admin` | Admin |
| `moderator` | Moderator |
| `member` | Member |

Affiliations:

| Stored value | Display label |
| --- | --- |
| `student` | Student |
| `alumni` | Alumni |
| `professor` | Professor |

## Implementation Guidance For Later

Do not implement this yet unless the human review gate is cleared.

When implementation begins, prefer this order:

1. Approve this document and answer the open decisions below.
2. Update product/backend docs so they no longer contradict the approved preset rules.
3. Create or choose one code source for presets.
   - Candidate: move shared constants into `Alexandria/lib/constants/presets.ts`.
   - Keep validation schemas importing from that source instead of defining separate lists.
4. Replace hardcoded department/research-area arrays in browse filters, detail pages, upload pages, admin pages, mock data, and seed data.
5. Add `conference` to review/detail surfaces if approved as part of required metadata.
6. Only after human review approval, run the appropriate verification requested by the user.

## Open Questions

1. What are the official stored codes and display names for the future departments: CpE, CE, Biology, and Psychology?
2. Should BSCS, BSIT, and BSIS become a separate `program` or `course` field later, or should Alexandria avoid storing them entirely for the MVP?
3. Should each thesis have one research area or multiple research areas?
4. Should `Networking` remain in the approved research-area list?
5. Should `Software Engineering` and `Computer Vision` be added as approved research areas, or mapped to broader existing areas?
6. Is `conference` required for every accepted thesis/capstone, or should it be optional metadata?
7. Is `publication_link` required for every submission, or should the uploaded PDF be enough when no public URL exists?
8. If the database keeps a date-shaped `publication_date` column, what internal placeholder day should represent month/year-only values?
