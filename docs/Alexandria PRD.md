# Alexandria: Digital Thesis Repository

## Product Requirements Document (MVP Version)

Last updated: 2026-06-24

## 1. Introduction

Alexandria is a web-based thesis repository designed for the Department of Computer Information Science and Mathematics (DCISM). The platform centralizes departmental research outputs and gives students a faster way to discover, access, and learn from previous thesis projects.

By combining thesis archiving with knowledge-sharing features such as recommendations, lessons learned, and related-thesis discovery, Alexandria preserves institutional knowledge and supports future researchers during thesis topic exploration and development.

## 2. Problem Statement

Completed thesis papers may be available through university archives, but access is often inconvenient and time-consuming. Students frequently struggle to discover relevant previous work, identify viable research directions, and learn from the experiences of earlier thesis groups.

As a result, students may spend significant time searching for references, unknowingly duplicate existing ideas, or encounter avoidable challenges during development and defense. DCISM needs a centralized, searchable, and access-controlled platform that makes previous research easier to find while preserving practical insights from past researchers.

## 3. User Personas and Target Users

### 3.1 Current Students

Students seeking thesis inspiration, related studies, and practical guidance from previous researchers.

### 3.2 Thesis Advisers

Faculty members responsible for evaluating research originality and advising student projects.

### 3.3 Future Researchers

Students and researchers interested in extending or building upon previous departmental work.

### 3.4 Department Administrators

Authorized personnel responsible for uploading, editing, publishing, and maintaining thesis repository records.

## 4. Goals and Objectives

### 4.1 MVP Goal

A student should be able to locate a relevant thesis within 30 seconds and understand whether it is useful to their research within 3 minutes.

### 4.2 Success Criteria

- Centralize departmental thesis records into a searchable repository.
- Reduce the effort required to discover related research.
- Improve student confidence during thesis topic exploration.
- Preserve recommendations and lessons learned from previous thesis groups.
- Restrict PDF preview and download access to authenticated users.
- Give administrators a controlled draft-to-publish workflow for repository quality.

## 5. Product Decisions

These decisions are accepted for the MVP and should guide database, backend, and frontend implementation.

| Area                        | Accepted decision                                          | Product impact                                                                                   |
| --------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Database                    | Supabase/PostgreSQL                                        | The data layer uses hosted PostgreSQL with migrations, indexes, and Row Level Security policies  |
| Authentication              | Supabase Auth                                              | Admin, Contributor, and Student visitor identity uses hosted authentication                      |
| PDF storage                 | Supabase Storage                                           | Uploaded thesis PDFs are stored in object storage; metadata is stored in the database            |
| PDF fallback                | External PDF/repository links only if storage is blocked   | Links remain available as a fallback, not the primary MVP storage path                           |
| PDF access                  | Public preview and download for accepted theses            | Guests may browse metadata and open accepted thesis PDFs; authentication is required to contribute |
| Admin workflow              | Draft then publish                                         | Admin-created records start as draft and must be manually published                              |
| Metadata entry              | PDF upload plus manual metadata entry                      | Admins upload the PDF and manually enter required metadata before publishing                     |
| Author and adviser handling | Unified in `Thesis_Authors`                                | Authors and advisers are both profile links on a thesis; advisers are identifiable by `profiles.category = 'teacher'` |
| Recommendations and lessons | Multiple ordered entries                                   | Each recommendation or lesson is stored/displayed as an ordered item                             |
| Related theses              | Computed on the frontend via shared keywords               | No `thesis_related` table; the frontend derives related theses from overlapping keywords at render time |
| Account creation            | Anyone with a `usc.edu.ph` email may create an account     | Members can self-register to contribute thesis submissions                                       |
| Metadata visibility         | Full accepted metadata is public                           | Anonymous users can inspect thesis details, but cannot access PDFs                               |
| Delete behavior             | Archive/unpublish in UI, with internal soft delete support | Normal admin UI should avoid hard deletion                                                       |
| User roles                  | `admin`, `student`, `moderator`                            | Admins manage users and system access; moderators review and approve uploads; students browse and access PDFs |
| Profile category            | `student`, `alumni`, `teacher`                             | Stored in `Profiles.category`; describes the USC identity of the user, separate from their system role |
| Review status               | `for_review`, `flagged`, `accepted`                        | Replaces `publication_status`; tracks moderator review state of each thesis record               |
| PDF versioning              | Archive old file metadata only                             | Replaced PDFs should preserve replacement history without full document version management       |
| Search behavior             | Search plus filters plus sort                              | MVP discovery includes keyword search, filter controls, and sorting                              |
| Default sort                | Newest thesis year first                                   | Repository browsing defaults to newest research first                                            |
| Research area vs tags       | Free-text research area plus free hashtag-style tags       | `research_area` is a free-text field on each thesis; distinct values power filter dropdowns. Tags are contributor-driven narrow hashtags |

## 6. Functional Requirements

### 6.1 Thesis Upload and Management

Authorized administrators shall be able to upload and manage thesis records.

Each admin-created thesis record shall start as `draft`. A draft may be edited until all required metadata and at least one valid PDF file are present. Administrators shall manually publish a completed draft to make it visible in the public repository.

Each thesis record shall contain:

- Title
- Ordered author names (stored as profile links in `Thesis_Authors`; advisers are identifiable by `profiles.category = 'teacher'`)
- Year
- Department
- Research area (free text; e.g. "Machine Learning", "Web Development")
- Abstract
- Keywords/tags (free hashtag-style, contributor-assigned)
- PDF file stored through Supabase Storage
- Optional external repository or resource links
- Awards and conference presentations, optional
- Multiple ordered recommendations for future researchers
- Multiple ordered lessons learned

Recommendations and lessons learned are separate required content types:

- Recommendations identify study gaps, research opportunities, limitations, or future work that later researchers can build on.
- Lessons learned capture practical execution guidance, such as development challenges, process advice, tooling issues, team workflow advice, defense preparation, and implementation pitfalls.

### 6.2 Thesis Repository and Discovery

The platform shall provide a centralized repository where users can browse published thesis records through an organized and visually accessible interface.

Each thesis card shall display:

- Title
- Ordered author names
- Year
- Abstract preview
- Research tags
- Research area, if available

Draft and archived thesis records shall not appear in the public repository.

Repository browsing shall default to newest thesis year first. Search result pages shall support keyword search, filters, and sorting.

### 6.3 Search and Filtering

Users shall be able to search published theses using:

- Title
- Author names
- Keywords/tags
- Abstract keywords
- Year

Users shall be able to filter results by:

- Research area
- Adviser
- Department
- Year

Users shall be able to sort results, with newest thesis year first as the default sort order.

Search and filtering shall return results within a few seconds under normal MVP usage.

### 6.4 Thesis Detail View

Users shall be able to access a dedicated thesis page for each published thesis.

The detail page shall contain:

- Complete metadata
- Ordered author names
- Full abstract
- Research tags
- PDF preview for authenticated users
- Download link for authenticated users
- Recommendations for future researchers
- Lessons learned
- Related theses
- Optional awards, conference presentations, and external links

Anonymous users shall not be able to preview or download thesis PDFs.

Full published thesis metadata shall remain visible to anonymous users. PDF access remains the boundary that requires authentication.

### 6.5 PDF Access

The system shall store thesis PDFs in Supabase Storage or equivalent object storage.

Accepted-thesis PDF preview and download are public. The current implementation
uses a public Supabase Storage bucket while keeping raw provider URLs out of
thesis DTOs.

If object storage becomes impractical during MVP development, the fallback is to store external PDF or repository links while preserving the same access-control intent where possible.

### 6.6 Related Thesis Discovery

The system shall recommend similar thesis projects based on shared tags, keywords, and research areas.

Related theses shall be computed dynamically for the MVP. Manual related-thesis overrides and AI-powered recommendations are not part of the MVP.

### 6.7 Authentication and Authorization

The system shall use Supabase Auth for user authentication.

The MVP shall support:

- Authenticated users who may preview and download PDFs for published theses
- Admin users who may manage accounts, repository records, publishing, archive/unpublish actions, and system-level content controls
- Contributor users who may help create and edit thesis records, subject to admin-defined publishing permissions
- Student visitor users who may browse metadata and preview/download PDFs after authentication
- Anonymous users who may browse/search published thesis metadata but may not access PDFs

Authorization shall be enforced through backend checks and Supabase Row Level Security where applicable.

Anyone with a `usc.edu.ph` email address may create a Student visitor account. Admin and Contributor accounts should be controlled by administrators.

### 6.8 Admin Publishing Workflow

The admin workflow shall support:

1. Create a draft thesis record.
2. Upload a PDF.
3. Manually enter required metadata.
4. Ordered authors and adviser are linked via `Thesis_Authors` (advisers identifiable by `profiles.category = 'teacher'`).
5. Tags and research area (free text) are added.
6. Add ordered recommendations and lessons learned.
7. Publish the record when required fields are complete.

The system should prevent publishing incomplete records.

Required publish fields are:

- Title
- At least one author
- At least one adviser (identifiable by linked profile's `category = 'teacher'`)
- Year
- Department
- Research area (free text)
- Abstract
- At least one tag
- Primary PDF file
- At least one recommendation for future researchers
- At least one lesson learned

### 6.9 Archive, Unpublish, and Soft Delete

The normal administrative removal action shall be archive/unpublish rather than hard delete.

Archived thesis records shall not appear in public repository browsing or search results. Internally, records should support soft delete behavior so accidental removals can be recovered or audited.

### 6.10 PDF Replacement History

When an administrator replaces a thesis PDF, the system should keep old file metadata for audit/history purposes while marking the newest valid file as the primary file.

The MVP does not require full downloadable version history for students.

### 6.11 Tags and Research Areas

Research areas shall be controlled values managed by administrators or seed data.

Tags shall be flexible keywords that can be assigned to thesis records to support search, filtering, and related-thesis discovery.

## 7. Non-Functional Requirements

### 7.1 Usability

The system shall prioritize simplicity and ease of navigation for students unfamiliar with academic repositories.

### 7.2 Accessibility

Users shall be able to access the platform through modern web browsers without requiring additional software installations.

### 7.3 Performance

Search results and thesis information should be retrievable within a few seconds under normal MVP usage.

### 7.4 Maintainability

The repository shall support future expansion without requiring major architectural changes.

### 7.5 Security

The system shall protect thesis PDFs from anonymous access. Admin-only actions shall require authenticated and authorized users. Database tables and storage objects should use least-privilege access controls.

### 7.6 Data Quality

Published thesis records shall contain complete required metadata. Draft records may be incomplete but must not be publicly visible.

### 7.7 Auditability and Recoverability

Archive/unpublish actions, publish actions, PDF replacement, and major metadata edits should be recoverable or traceable through soft delete fields, status fields, or audit-oriented metadata.

## 8. Project Scope

### 8.1 Included in MVP

- Public thesis repository metadata browsing
- Student visitor self-registration using `usc.edu.ph` email addresses
- Upload and management system for administrators
- Contributor role for repository content maintenance
- Draft-to-publish workflow
- Archive/unpublish workflow with internal soft delete support
- Search and filtering
- Sorting, defaulting to newest thesis year first
- Public PDF preview and download for accepted theses
- PDF replacement with old file metadata retained
- Recommendations and lessons learned as ordered entries
- Required distinction between future-study recommendations and practical lessons learned
- Related thesis suggestions based on shared tags/research area
- Controlled research areas plus flexible tags
- Supabase/PostgreSQL database
- Supabase Auth
- Supabase Storage

### 8.2 Excluded from MVP

- AI-generated summaries
- AI-powered thesis recommendations
- Research gap analysis
- Student discussions and commenting
- Semantic search
- University-wide integration
- Public anonymous PDF download
- Reusable author profiles or author contact management
- Manual related-thesis overrides
- Full student-facing PDF version history
- Hard delete through the normal admin UI
- Open public registration without school email restriction

These features are reserved for future versions of the platform.

## 9. MVP Definition of Success

Alexandria succeeds if students can quickly discover relevant thesis projects, understand their relevance, learn from previous researchers' experiences, and make more informed decisions regarding their own research directions.

For the MVP, success also requires that thesis PDFs are protected behind authentication, administrators can safely prepare records as drafts before publishing, and database/backend/frontend work follows the accepted Supabase-based architecture.

## 10. Related Documents

- [Database Engineer Reference](./database-engineer-reference.md)
- [Design Decision Log](./design-decision-log.md)
- [Group 3 Project Proposal](./Group%203%20_%20Project%20Proposal.md)
