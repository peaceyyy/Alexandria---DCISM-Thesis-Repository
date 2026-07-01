// ─── Primitives ──────────────────────────────────────────────────────────────
export type ReviewStatus = "for_review" | "flagged" | "accepted" | "trashed";
export type UserRole = "admin" | "moderator" | "member";
export type Affiliation = "student" | "alumni" | "professor";
export type ContributionRole = "author" | "adviser";
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
  recommendations: string | null;
  lessons_learned: string | null;
  submitted_by_user_id: string | null; // uuid — nullable for legacy/admin uploads
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
  file_url: string; // NEVER returned to public payloads
  is_primary: boolean;
  created_at: string;
};
export type DbThesisAudit = {
  id: number;
  thesis_id: number;
  changed_by_user_id: string;
  change_description: string;
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
    requires_auth: boolean;
    download_path: string | null; // e.g. "/theses/1/file" — never a raw URL
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
};
/** Row shape for the admin review dashboard list. */
export type AdminThesisRow = {
  id: number;
  title: string;
  review_status: ReviewStatus;
  year: number;
  updated_at: string;
  submitted_by_user_id: string | null;
};
/** Row shape for the admin user management list. Alias of CurrentUser. */
export type UserAdminRow = CurrentUser;
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
export type ThesisAuthorInput = {
  user_id: string | null;
  display_name: string;
  contribution_role: ContributionRole;
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
  publication_date?: string;
  publication_link?: string;
  conference?: string;
  recommendations?: string;
  lessons_learned?: string;
};
/** All fields optional — partial PATCH. */
export type updateThesisStatusPayload = Partial<SubmitThesisPayload>;
export type RegisterFilePayload = {
  file_url: string;
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
  page?: number;
  limit?: number;
};
