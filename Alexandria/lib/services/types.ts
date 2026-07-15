// ─── Primitives ──────────────────────────────────────────────────────────────
export type ReviewStatus = "for_review" | "flagged" | "accepted" | "trashed";
export type UserRole = "admin" | "moderator" | "member";
export type Affiliation = "student" | "alumni" | "professor";
export type ContributionRole = "author" | "adviser";
export type StudyType = "thesis" | "capstone";
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
export type ReviewAuditEventType =
  | "submitted"
  | "comment_added"
  | "comment_addressed"
  | "status_changed"
  | "metadata_edited"
  | "pdf_replaced"
  | "resubmitted";
// ─── Pagination & Result Envelope ────────────────────────────────────────────
export type PaginationMeta = {
  total_count: number;
  page: number;
  limit: number;
};
export type ServiceError = {
  code: string; // e.g. "VALIDATION_FAILED", "FORBIDDEN"
  message: string;
  details?: Record<string, unknown>;
};
export type ServiceResult<T> =
  | { data: T; error: null; meta?: PaginationMeta }
  | { data: null; error: ServiceError };
// ─── Raw DB Row Types (never returned to UI directly) ────────────────────────
export type DbUser = {
  id: string; // uuid — mirrors auth.users.id
  email: string;
  profile_name: string;
  usc_id: number | null;
  role: UserRole;
  affiliation: Affiliation;
  created_at: string;
  deactivated_at: string | null;
  deactivation_reason: string | null;
  deactivated_by_user_id: string | null;
};
export type DbThesis = {
  id: number; // bigint identity
  title: string;
  abstract: string | null;
  year: number;
  department: string;
  research_area: string | null;
  review_status: ReviewStatus;
  publication_date: string | null;
  publication_link: string | null;
  conference: string | null;
  study_type: StudyType;
  recommendations: string | null;
  lessons_learned: string | null;
  submitted_by_user_id: string | null; // uuid — nullable for legacy/imported rows
  created_at: string;
  updated_at: string;
};
export type DbThesisAuthor = {
  id: number;
  thesis_id: number;
  user_id: string | null; // uuid — nullable for external/non-registered authors
  display_name: string;
  contribution_role: ContributionRole;
  sort_order: number | null;
};
export type DbThesisTag = {
  id: number;
  thesis_id: number;
  tag: string;
};
export type DbThesisFile = {
  id: number;
  thesis_id: number;
  file_url: string | null; // transitional legacy field
  storage_path: string; // NEVER returned to public payloads
  file_type: string;
  is_primary: boolean;
};
export type DbThesisAudit = {
  id: number;
  thesis_id: number;
  changed_by_user_id: string;
  event: ReviewAuditEventType | null;
  change_description: string | null;
  updated_at: string;
};
export type DbThesisReviewComment = {
  id: number;
  thesis_id: number;
  field_key: ReviewFieldKey;
  comment: string;
  created_by_user_id: string;
  addressed_at: string | null;
  addressed_by_user_id: string | null;
  member_revised_at: string | null;
  created_at: string;
};
// ─── UI / Service DTOs (frontend-safe shapes) ────────────────────────────────
export type ThesisAuthor = {
  id: number;
  user_id: string | null;
  display_name: string;
  contribution_role: ContributionRole;
  sort_order: number | null;
};
/** Used on the Browse/Search page and as embedded related-thesis cards. */
export type ThesisCard = {
  id: number;
  title: string;
  authors: ThesisAuthor[];
  year: number;
  abstract_preview: string; // first ~200 chars of abstract
  tags: string[];
  research_area: string | null;
  department: string;
};
/** Used on the Thesis Detail page. Extends ThesisCard. */
export type ThesisDetail = ThesisCard & {
  abstract: string;
  authors: ThesisAuthor[];
  department: string;
  publication_date: string | null;
  publication_link: string | null;
  conference: string | null;
  recommendations: string | null;
  lessons_learned: string | null;
  file_access: {
    has_primary_file: boolean;
    preview_path: string | null;
    download_path: string | null;
    download_requires_auth: boolean;
  };
  related_theses: ThesisCard[]; // frontend-computed from tag overlap
};
/** Dropdowns for year/department/research_area filters on the Browse page. */
export type FilterOptions = {
  research_areas: string[];
  departments: string[];
  years: number[];
};
/** Returned after successful login / getCurrentUser(). */
export type CurrentUser = {
  id: string;
  email: string;
  profile_name: string;
  usc_id: number | null;
  role: UserRole;
  affiliation: Affiliation;
  created_at: string;
};
/** Row shape for the admin review dashboard list. */
export type AdminThesisRow = {
  id: number;
  title: string;
  review_status: ReviewStatus;
  year: number;
  updated_at: string;
  submitted_by_user_id: string | null;
  study_type: StudyType;
};
export type ReviewComment = {
  id: number;
  thesisId: number;
  fieldKey: ReviewFieldKey;
  comment: string;
  createdByUserId: string;
  createdByName: string;
  createdAt: string;
  addressedAt: string | null;
  addressedByUserId: string | null;
  memberRevisedAt: string | null;
};
export type ReviewAuditEvent = {
  id: number;
  thesisId: number;
  event: ReviewAuditEventType;
  description: string;
  createdByName: string;
  createdAt: string;
};
export type ReviewSubmission = {
  id: number;
  title: string;
  authors: string[];
  advisers: string[];
  contributorEntries?: ThesisAuthor[];
  department: string;
  studyType: StudyType;
  publicationDate: string;
  publicationLink: string | null;
  conference: string | null;
  researchArea: string | null;
  tags: string[];
  abstract: string;
  recommendations: string | null;
  lessonsLearned: string | null;
  submittedAt: string;
  submittedByUserId: string | null;
  reviewStatus: ReviewStatus;
  primaryFile: {
    fileName: string;
    fileSize: string | null;
    pdfUrl: string;
  } | null;
  fieldComments: ReviewComment[];
  auditEvents: ReviewAuditEvent[];
};
export type ReviewSubmissionListItem = Pick<
  ReviewSubmission,
  | "id"
  | "title"
  | "authors"
  | "department"
  | "studyType"
  | "submittedAt"
  | "reviewStatus"
> & {
  year: number;
  researchArea: string | null;
  abstractPreview: string;
  commentCount: number;
};
export type MySubmissionListItem = ReviewSubmissionListItem & {
  flaggedCommentCount: number;
};
export type DashboardUploadRow = {
  id: number;
  title: string;
  author: string;
  created_at: string;
  review_status: Exclude<ReviewStatus, "trashed">;
};
export type DashboardActivityRow = {
  id: number;
  thesis_id: number;
  text: string;
  occurred_at: string;
};
export type DepartmentResearchCount = {
  department: string;
  count: number;
};
export type AdminDashboardSnapshot = {
  viewer: {
    profile_name: string;
  };
  metrics: {
    total_research: number;
    registered_users: number;
    pending_docs: number;
  };
  recent_uploads: DashboardUploadRow[];
  recent_activity: DashboardActivityRow[];
  research_by_department: DepartmentResearchCount[];
};
export type UserAccountStatus = "active" | "deactivated";
export type UserRoleCounts = Record<UserRole, number>;
/** Frontend-safe row shape for admin user management. */
export type UserAdminRow = CurrentUser & {
  deactivated_at: string | null;
  deactivation_reason: string | null;
  deactivated_by_user_id: string | null;
};
/** Returned inside a VALIDATION_FAILED ServiceError's details. */
export type ValidationErrorList = {
  missing_fields: string[];
};
// ─── Request Payload Types ────────────────────────────────────────────────────
export type RegisterPayload = {
  email: string;
  password: string;
  profile_name: string;
  usc_id?: number;
  affiliation: Affiliation;
};
export type ThesisAuthorInput = Omit<ThesisAuthor, "id" | "sort_order"> & {
  sort_order: number;
};
export type SubmitThesisPayload = {
  title: string;
  abstract: string;
  year: number;
  department: string;
  research_area: string;
  authors: ThesisAuthorInput[];
  tags: string[];
  storage_path: string;
  file_type: "application/pdf";
  publication_date: string;
  publication_link?: string;
  conference?: string;
  recommendations?: string;
  lessons_learned?: string;
  study_type: StudyType;
};
export type SubmitThesisInput = Omit<
  SubmitThesisPayload,
  "storage_path" | "file_type" | "year"
>;
/** All fields optional — partial PATCH. */
export type updateThesisStatusPayload = Partial<SubmitThesisPayload>;
export type RegisterFilePayload = {
  storage_path: string;
  file_type?: string;
  is_primary: boolean;
};
export type ThesisListParams = {
  q?: string;
  year?: number;
  department?: string;
  research_area?: string;
  page?: number; // default 1
  limit?: number; // default 20
};
export type AdminThesisListParams = {
  review_status?: ReviewStatus;
  page?: number;
  limit?: number;
};
export type UserListParams = {
  role?: UserRole;
  account_status?: UserAccountStatus;
  page?: number;
  limit?: number;
};
export type ReviewSubmissionListParams = {
  reviewStatus?: ReviewStatus;
  q?: string;
  page?: number;
  limit?: number;
};
export type OwnSubmissionListParams = {
  status?: ReviewStatus | "all";
  q?: string;
};
export type AddReviewCommentInput = {
  thesisId: number;
  fieldKey: ReviewFieldKey;
  comment: string;
};
export type SetReviewStatusInput = {
  thesisId: number;
  nextStatus: Extract<ReviewStatus, "for_review" | "flagged" | "accepted" | "trashed">;
};
export type AdminUpdateSubmissionMetadataInput = {
  thesisId: number;
  values: Partial<SubmitThesisInput>;
  correctionReason: string;
};
export type UpdateFlaggedSubmissionInput = {
  thesisId: number;
  values: Partial<SubmitThesisInput>;
};
