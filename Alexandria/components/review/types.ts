/**
 * Review Feedback Type Contract
 *
 * These types mirror the planned backend schema:
 *   - thesis_review_comments table → ReviewComment
 *   - thesis_audits table          → ReviewAuditEvent
 *
 * Field naming follows Supabase camelCase convention (DB snake_case → TS camelCase).
 *
 * Swapping to real API data:
 *   1. Replace `fieldComments: ReviewComment[]` in MockReviewSubmission with a
 *      Supabase query result for `thesis_review_comments`.
 *   2. Replace `auditEvents: ReviewAuditEvent[]` with a query for `thesis_audits`.
 *   3. The ReviewComment and ReviewAuditEvent shapes here should remain stable.
 */

// Re-export canonical ReviewStatus from the service layer so components
// only need one import path.
export type { ReviewStatus } from "@/lib/services/types";

// ─── Field Keys ──────────────────────────────────────────────────────────────

export type ReviewFieldKey =
  | "title"
  | "authors"
  | "advisers"
  | "department"
  | "study_type"
  | "publication_date"
  | "publication_link"
  | "conference"
  | "research_area"
  | "tags"
  | "abstract"
  | "recommendations"
  | "lessons_learned"
  | "pdf_general";

// ─── Display Maps ────────────────────────────────────────────────────────────

import type { ReviewStatus } from "@/lib/services/types";

/** Maps backend status value → friendly UI label. Never store UI labels. */
export const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  for_review: "Under review",
  flagged: "Needs revision",
  accepted: "Published",
  trashed: "Archived",
};

/** Maps each reviewable field key → human-readable section label. */
export const REVIEW_FIELD_LABEL: Record<ReviewFieldKey, string> = {
  title: "Title",
  authors: "Authors",
  advisers: "Advisers",
  department: "Department",
  study_type: "Study Type",
  publication_date: "Publication Date",
  publication_link: "Publication Link",
  conference: "Conference",
  research_area: "Research Area",
  tags: "Tags",
  abstract: "Abstract",
  recommendations: "Recommendations",
  lessons_learned: "Lessons Learned",
  pdf_general: "PDF / Paper Feedback",
};

// ─── Comment Shape ───────────────────────────────────────────────────────────

/**
 * Mirrors the thesis_review_comments table shape.
 *
 * DB column → TS field:
 *   id                  → id
 *   thesis_id           → thesisId
 *   field_key           → fieldKey
 *   comment             → comment
 *   created_by_user_id  → createdByUserId
 *   created_by_name     → createdByName  (denormalized display name)
 *   created_at          → createdAt
 *   addressed_at        → addressedAt
 *   addressed_by_user_id → addressedByUserId
 *   member_revised_at   → memberRevisedAt
 */
export interface ReviewComment {
  id: number;
  thesisId: number;
  fieldKey: ReviewFieldKey;
  comment: string;
  createdByUserId: string;
  createdByName: string;
  createdAt: string; // ISO 8601
  addressedAt: string | null;
  addressedByUserId: string | null;
  memberRevisedAt: string | null;
}

// ─── Audit Event Shape ───────────────────────────────────────────────────────

export type ReviewAuditEventType =
  | "submitted"
  | "comment_added"
  | "comment_addressed"
  | "status_changed"
  | "metadata_edited"
  | "pdf_replaced"
  | "resubmitted";

/**
 * Mirrors the thesis_audits table shape.
 *
 * DB column → TS field:
 *   id                  → id
 *   thesis_id           → thesisId
 *   event               → event
 *   change_description  → description
 *   changed_by_user_id  → createdByUserId
 *   updated_at          → createdAt
 */
export interface ReviewAuditEvent {
  id: number;
  thesisId: number;
  event: ReviewAuditEventType;
  description: string;
  createdByName: string;
  createdAt: string; // ISO 8601
}

// ─── Submission Shape for Review Pages ──────────────────────────────────────

/**
 * The full shape expected by the review detail page.
 * Composed of fields from:
 *   - theses table (title, abstract, etc.)
 *   - thesis_authors (authors + advisers via contribution_role)
 *   - thesis_tags (tags[])
 *   - thesis_files (primary PDF info)
 *   - thesis_review_comments (fieldComments[])
 *   - thesis_audits (auditEvents[])
 *
 * When connecting to the backend, build this from a single joined query
 * or parallel fetches and assemble on the service layer.
 */
export interface ReviewSubmission {
  id: number;
  title: string;
  authors: string[];    // display_name where contribution_role = 'author'
  advisers: string[];   // display_name where contribution_role = 'adviser'
  department: string;
  studyType: "thesis" | "capstone";
  publicationDate: string;        // matches DB publication_date
  publicationLink: string | null; // matches DB publication_link
  conference: string | null;      // matches DB conference
  researchArea: string | null;    // matches DB research_area
  tags: string[];                 // from thesis_tags
  abstract: string;
  recommendations: string | null;
  lessonsLearned: string | null;
  submittedAt: string;             // matches DB created_at (submission date)
  reviewStatus: ReviewStatus;    // matches DB review_status
  // File info (from thesis_files where is_primary = true)
  primaryFile: {
    fileName: string;
    fileSize: string;
    pdfUrl: string; // guarded route — replace with signed URL from backend
  } | null;
  // Review data (from related tables)
  fieldComments: ReviewComment[];
  auditEvents: ReviewAuditEvent[];
}
