## Impeccable Shape Brief

**Feature**: Thesis / Capstone Submission Page (`/upload`)
**Purpose**: Allow DCISM students and alumni to submit their accepted thesis work securely, providing structured metadata (authors, abstract) and qualitative insights (recommendations, lessons learned) alongside the PDF.
**User**: An authenticated DCISM student or alumni. State of mind is task-focused and potentially anxious; they want to ensure their academic submission is perfectly accurate before final review.
**Content**: 
- **Study Basics**: Title, Department, Type of Study (Thesis/Capstone), Publication Date.
- **Publication Details**: Conference, Publication Link (both required).
- **People**: Authors (ordered list) and Adviser(s).
- **Content**: Abstract, Research Area, Keywords/Tags.
- **Insights**: Recommendations, Lessons Learned.
- **Upload**: PDF file (max 10 MiB).
**Feeling**: Calm, guided, clinical, and premium. A structured, step-by-step onboarding feel, rather than an overwhelming single-page bureaucratic form.
**Constraints**:
- **Technical**: Supabase backend (already partially linked), Zod validation.
- **UX Rules**: 
  - Stepped wizard layout with free forward/backward navigation.
  - Validation occurs upon reaching the final Review step.
  - Focus mode header (Logo left, Profile right, no other navigation).
  - Unsaved changes warning upon exit attempt (back button/escape).
  - Modal overlay for long-form text (Abstract, Recommendations, Lessons Learned).
  - Lessons Learned uses a drag-and-drop sentence-builder UX (via `@dnd-kit`).
  - Floating popup panel for Research Area multi-select.
  - Authors and Advisers visually grouped but functionally separate.
**References**: Figma mockup (Node 21:46), existing `docs/DESIGN.md`.
**Anti-References**: Generic, single-page infinite scrolling forms. Basic textareas without guidance for structured lists.
**Hand To**: `/impeccable-craft`
