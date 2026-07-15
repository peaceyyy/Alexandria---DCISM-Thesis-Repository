"use server";

import { createClient } from "../supabase/server";
import {
  removeThesisFileFromStorage,
  uploadThesisFileToStorage,
} from "../upload/storage-helper";
import {
  THESIS_PDF_MIME_TYPE,
  validateThesisPdf,
} from "../upload/file-validation";
import { isDepartment } from "../domain/departments";
import { requireOwnership, requireRole, requireSession } from "./_guards";
import {
  err,
  makeError,
  normalizeServiceError,
  ok,
} from "./result";
import type {
  AddReviewCommentInput,
  AdminUpdateSubmissionMetadataInput,
  MySubmissionListItem,
  OwnSubmissionListParams,
  ReviewAuditEvent,
  ReviewAuditEventType,
  ReviewComment,
  ReviewFieldKey,
  ReviewStatus,
  ReviewSubmission,
  ReviewSubmissionListItem,
  ReviewSubmissionListParams,
  ServiceError,
  ServiceResult,
  SetReviewStatusInput,
  StudyType,
  SubmitThesisInput,
  ThesisAuthor,
  ThesisAuthorInput,
  UpdateFlaggedSubmissionInput,
} from "./types";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const REVIEWABLE_FIELDS: ReviewFieldKey[] = [
  "title",
  "authors",
  "advisers",
  "department",
  "study_type",
  "publication_date",
  "publication_link",
  "conference",
  "research_area",
  "tags",
  "abstract",
  "recommendations",
  "lessons_learned",
  "pdf_general",
];
const REVIEW_STATUSES: ReviewStatus[] = [
  "for_review",
  "flagged",
  "accepted",
  "trashed",
];
const STUDY_TYPES: StudyType[] = ["thesis", "capstone"];
const AUDIT_EVENTS: ReviewAuditEventType[] = [
  "submitted",
  "comment_added",
  "comment_addressed",
  "status_changed",
  "metadata_edited",
  "pdf_replaced",
  "resubmitted",
];
const APPLICATION_TIME_ZONE = "Asia/Manila";
const ISO_CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

type ThesisRow = {
  id: number;
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
  submitted_by_user_id: string | null;
  created_at: string;
  updated_at: string;
  study_type: StudyType;
};

type AuthorRow = {
  id: number;
  thesis_id: number;
  user_id: string | null;
  display_name: string;
  contribution_role: "author" | "adviser";
  sort_order: number | null;
};

type TagRow = {
  thesis_id: number;
  tag: string;
};

type FileRow = {
  thesis_id: number;
  storage_path: string | null;
  file_type: string | null;
  is_primary: boolean;
};

type CommentRow = {
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

type AuditRow = {
  id: number;
  thesis_id: number;
  changed_by_user_id: string;
  event: ReviewAuditEventType | null;
  change_description: string | null;
  updated_at: string;
};

type UserNameRow = {
  id: string;
  profile_name: string | null;
  email: string | null;
};

function normalizedPage(value?: number) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    return 1;
  }

  return value;
}

function normalizedLimit(value?: number) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    return DEFAULT_PAGE_SIZE;
  }

  return Math.min(value, MAX_PAGE_SIZE);
}

function isPositiveInteger(value: number) {
  return Number.isInteger(value) && value > 0;
}

function isReviewStatus(value: unknown): value is ReviewStatus {
  return typeof value === "string" && REVIEW_STATUSES.includes(value as ReviewStatus);
}

function isReviewField(value: unknown): value is ReviewFieldKey {
  return typeof value === "string" && REVIEWABLE_FIELDS.includes(value as ReviewFieldKey);
}

function isStudyType(value: unknown): value is StudyType {
  return typeof value === "string" && STUDY_TYPES.includes(value as StudyType);
}

function getCurrentCalendarDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: APPLICATION_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

function isValidCalendarDate(value: string) {
  const match = ISO_CALENDAR_DATE.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);

  return (
    year >= 1 &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function getStorageFileName(storagePath: string | null) {
  if (!storagePath) {
    return "Thesis PDF";
  }

  return storagePath.split("/").filter(Boolean).at(-1) ?? "Thesis PDF";
}

function fallbackAuditEvent(value: ReviewAuditEventType | null): ReviewAuditEventType {
  return value && AUDIT_EVENTS.includes(value) ? value : "status_changed";
}

type SupabaseMutationError = {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
};

function isSupabaseMutationError(value: unknown): value is SupabaseMutationError {
  return Boolean(
    value
      && typeof value === "object"
      && "message" in value
      && typeof (value as SupabaseMutationError).message === "string",
  );
}

function mutationError(error: unknown, fallbackMessage: string): ServiceError {
  if (!isSupabaseMutationError(error)) {
    return makeError("SUPABASE_ERROR", fallbackMessage);
  }

  const safeMessages = new Set([
    "An active administrator or moderator account is required",
    "An active authenticated user profile is required",
    "An active member account is required",
    "A review comment is required",
    "That review field cannot be commented on",
    "Thesis was not found",
    "Comments can only be added while a submission is under review",
    "That review status transition is not allowed",
    "Submission changes must be an object",
    "You are not the owner of this thesis",
    "Only flagged submissions can be edited by members",
    "Publication date is required",
    "Publication date cannot be later than today",
    "Study type must be thesis or capstone",
    "At least one thesis author is required",
    "Every thesis author requires a display name",
    "Contribution role must be author or adviser",
    "At least one tag is required",
    "Only flagged submissions can have addressed comments",
    "Review comment was not found",
    "Save a change to this field before marking the comment addressed",
    "Only flagged submissions can replace their PDF",
    "Thesis file type must be application/pdf",
    "The uploaded file path must belong to the authenticated user",
    "The uploaded thesis PDF was not found in Storage",
    "Only flagged submissions can be resubmitted",
  ]);
  const message = error.message || fallbackMessage;

  console.error("[review-service] Supabase mutation failed", {
    code: error.code,
    message,
    details: error.details,
    hint: error.hint,
  });

  if (error.code === "P0002") {
    return makeError("NOT_FOUND", safeMessages.has(message) ? message : fallbackMessage);
  }

  if (error.code === "42501") {
    return makeError("FORBIDDEN", safeMessages.has(message) ? message : fallbackMessage);
  }

  if (error.code === "22023") {
    return makeError("VALIDATION_FAILED", safeMessages.has(message) ? message : fallbackMessage);
  }

  return makeError(
    "SUPABASE_ERROR",
    safeMessages.has(message) ? message : fallbackMessage,
    error.code ? { supabase_code: error.code } : undefined,
  );
}

function hasSchemaCacheReference(error: unknown, reference: string) {
  if (!isSupabaseMutationError(error)) {
    return false;
  }

  return (
    ["PGRST204", "PGRST205"].includes(error.code ?? "")
    && error.message.toLowerCase().includes(reference.toLowerCase())
  );
}

function isMissingReviewCommentsTable(error: unknown) {
  return Boolean(
    isSupabaseMutationError(error)
    && (
      error.code === "42P01"
      || hasSchemaCacheReference(error, "thesis_review_comments")
    ),
  );
}

function isMissingAuditEventColumn(error: unknown) {
  return Boolean(
    isSupabaseMutationError(error)
    && (
      error.code === "42703"
      || hasSchemaCacheReference(error, "event")
    ),
  );
}

function validateThesisId(thesisId: number): ServiceError | null {
  if (!isPositiveInteger(thesisId)) {
    return makeError("VALIDATION_FAILED", "A valid thesis id is required.");
  }

  return null;
}

function validateAuthorInput(authors: ThesisAuthorInput[]) {
  if (!Array.isArray(authors) || authors.length === 0) {
    return makeError("VALIDATION_FAILED", "At least one thesis author is required.");
  }

  if (
    authors.some((author) =>
      !author
      || typeof author.display_name !== "string"
      || !author.display_name.trim()
      || !["author", "adviser"].includes(author.contribution_role)
      || typeof author.sort_order !== "number"
      || !Number.isInteger(author.sort_order)
    )
  ) {
    return makeError("VALIDATION_FAILED", "Every thesis author must have a name, role, and order.");
  }

  return null;
}

function validateTags(tags: string[]) {
  if (!Array.isArray(tags) || tags.length === 0 || tags.some((tag) => !tag.trim())) {
    return makeError("VALIDATION_FAILED", "At least one tag is required.");
  }

  return null;
}

function buildUpdatePayload(values: Partial<SubmitThesisInput>) {
  const payload: Record<string, unknown> = {};
  const allowedTextFields = [
    "title",
    "abstract",
    "department",
    "research_area",
    "publication_date",
    "publication_link",
    "conference",
    "recommendations",
    "lessons_learned",
  ] as const;

  for (const key of allowedTextFields) {
    const value = values[key];
    if (typeof value === "string") {
      payload[key] = value;
    }
  }

  if (values.study_type !== undefined) {
    payload.study_type = values.study_type;
  }

  if (values.authors !== undefined) {
    payload.authors = values.authors.map((author) => ({
      user_id: author.user_id,
      display_name: author.display_name,
      contribution_role: author.contribution_role,
      sort_order: author.sort_order,
    }));
  }

  if (values.tags !== undefined) {
    payload.tags = values.tags;
  }

  return payload;
}

function validateUpdatePayload(values: Partial<SubmitThesisInput>) {
  if (!values || typeof values !== "object" || Array.isArray(values)) {
    return makeError("VALIDATION_FAILED", "Submission changes are required.");
  }

  if (values.study_type !== undefined && !isStudyType(values.study_type)) {
    return makeError("VALIDATION_FAILED", "Study type must be thesis or capstone.");
  }

  if (values.department !== undefined && !isDepartment(values.department)) {
    return makeError("VALIDATION_FAILED", "Department must be CS, IT, or IS.");
  }

  if (values.publication_date !== undefined) {
    if (
      !isValidCalendarDate(values.publication_date)
      || values.publication_date > getCurrentCalendarDate()
    ) {
      return makeError("VALIDATION_FAILED", "Publication date must be valid and cannot be later than today.");
    }
  }

  if (values.authors !== undefined) {
    const authorsError = validateAuthorInput(values.authors);
    if (authorsError) {
      return authorsError;
    }
  }

  if (values.tags !== undefined) {
    const tagsError = validateTags(values.tags);
    if (tagsError) {
      return tagsError;
    }
  }

  if (Object.keys(buildUpdatePayload(values)).length === 0) {
    return makeError("VALIDATION_FAILED", "At least one editable field is required.");
  }

  return null;
}

async function loadUserNames(userIds: string[]) {
  const uniqueIds = uniqueStrings(userIds);
  if (uniqueIds.length === 0) {
    return new Map<string, string>();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, profile_name, email")
    .in("id", uniqueIds);

  if (error) {
    return new Map<string, string>();
  }

  return new Map(
    ((data ?? []) as UserNameRow[]).map((user) => [
      user.id,
      user.profile_name || user.email || "Unknown user",
    ]),
  );
}

async function loadThesisBundle(thesisId: number): Promise<{
  thesis: ThesisRow;
  authors: AuthorRow[];
  tags: TagRow[];
  primaryFile: FileRow | null;
  comments: CommentRow[];
  audits: AuditRow[];
}> {
  const supabase = await createClient();
  const { data: thesis, error: thesisError } = await supabase
    .from("theses")
    .select(`
      id,
      title,
      abstract,
      year,
      department,
      research_area,
      review_status,
      publication_date,
      publication_link,
      conference,
      recommendations,
      lessons_learned,
      submitted_by_user_id,
      created_at,
      updated_at,
      study_type
    `)
    .eq("id", thesisId)
    .single();

  if (thesisError || !thesis) {
    throw makeError("NOT_FOUND", "Thesis not found.");
  }

  const [
    authorsResult,
    tagsResult,
    filesResult,
    commentsResult,
  ] = await Promise.all([
    supabase
      .from("thesis_authors")
      .select("id, thesis_id, user_id, display_name, contribution_role, sort_order")
      .eq("thesis_id", thesisId)
      .order("contribution_role", { ascending: true })
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("id", { ascending: true }),
    supabase
      .from("thesis_tags")
      .select("thesis_id, tag")
      .eq("thesis_id", thesisId)
      .order("tag", { ascending: true }),
    supabase
      .from("thesis_files")
      .select("thesis_id, storage_path, file_type, is_primary")
      .eq("thesis_id", thesisId)
      .eq("is_primary", true)
      .limit(1),
    supabase
      .from("thesis_review_comments")
      .select(`
        id,
        thesis_id,
        field_key,
        comment,
        created_by_user_id,
        addressed_at,
        addressed_by_user_id,
        member_revised_at,
        created_at
      `)
      .eq("thesis_id", thesisId)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true }),
  ]);

  let auditsResult = await supabase
    .from("thesis_audits")
    .select("id, thesis_id, changed_by_user_id, event, change_description, updated_at")
    .eq("thesis_id", thesisId)
    .order("updated_at", { ascending: false })
    .order("id", { ascending: false });

  if (isMissingAuditEventColumn(auditsResult.error)) {
    const fallbackAuditsResult = await supabase
      .from("thesis_audits")
      .select("id, thesis_id, changed_by_user_id, change_description, updated_at")
      .eq("thesis_id", thesisId)
      .order("updated_at", { ascending: false })
      .order("id", { ascending: false });

    auditsResult = {
      ...fallbackAuditsResult,
      data: ((fallbackAuditsResult.data ?? []) as Omit<AuditRow, "event">[]).map(
        (audit) => ({
          ...audit,
          event: null,
        }),
      ),
    };
  }

  const firstError = [
    authorsResult.error,
    tagsResult.error,
    filesResult.error,
    isMissingReviewCommentsTable(commentsResult.error)
      ? null
      : commentsResult.error,
    auditsResult.error,
  ].find(Boolean);

  if (firstError) {
    throw makeError("SUPABASE_ERROR", "Review submission data could not be loaded.");
  }

  return {
    thesis: thesis as ThesisRow,
    authors: (authorsResult.data ?? []) as AuthorRow[],
    tags: (tagsResult.data ?? []) as TagRow[],
    primaryFile: ((filesResult.data ?? []) as FileRow[])[0] ?? null,
    comments: isMissingReviewCommentsTable(commentsResult.error)
      ? []
      : (commentsResult.data ?? []) as CommentRow[],
    audits: (auditsResult.data ?? []) as AuditRow[],
  };
}

async function loadReviewSubmission(thesisId: number): Promise<ReviewSubmission> {
  const bundle = await loadThesisBundle(thesisId);
  const userNames = await loadUserNames([
    ...bundle.comments.map((comment) => comment.created_by_user_id),
    ...bundle.audits.map((audit) => audit.changed_by_user_id),
  ]);

  const comments: ReviewComment[] = bundle.comments.map((comment) => ({
    id: comment.id,
    thesisId: comment.thesis_id,
    fieldKey: comment.field_key,
    comment: comment.comment,
    createdByUserId: comment.created_by_user_id,
    createdByName: userNames.get(comment.created_by_user_id) ?? "Unknown user",
    createdAt: comment.created_at,
    addressedAt: comment.addressed_at,
    addressedByUserId: comment.addressed_by_user_id,
    memberRevisedAt: comment.member_revised_at,
  }));

  const audits: ReviewAuditEvent[] = bundle.audits.map((audit) => ({
    id: audit.id,
    thesisId: audit.thesis_id,
    event: fallbackAuditEvent(audit.event),
    description: audit.change_description || "Thesis activity recorded.",
    createdByName: userNames.get(audit.changed_by_user_id) ?? "Unknown user",
    createdAt: audit.updated_at,
  }));

  return {
    id: bundle.thesis.id,
    title: bundle.thesis.title,
    authors: bundle.authors
      .filter((author) => author.contribution_role === "author")
      .map((author) => author.display_name),
    advisers: bundle.authors
      .filter((author) => author.contribution_role === "adviser")
      .map((author) => author.display_name),
    contributorEntries: bundle.authors.map((author): ThesisAuthor => ({
      id: author.id,
      user_id: author.user_id,
      display_name: author.display_name,
      contribution_role: author.contribution_role,
      sort_order: author.sort_order,
    })),
    department: bundle.thesis.department,
    studyType: bundle.thesis.study_type,
    publicationDate: bundle.thesis.publication_date ?? "",
    publicationLink: bundle.thesis.publication_link,
    conference: bundle.thesis.conference,
    researchArea: bundle.thesis.research_area,
    tags: bundle.tags.map((tag) => tag.tag),
    abstract: bundle.thesis.abstract ?? "",
    recommendations: bundle.thesis.recommendations,
    lessonsLearned: bundle.thesis.lessons_learned,
    submittedAt: bundle.thesis.created_at,
    submittedByUserId: bundle.thesis.submitted_by_user_id,
    reviewStatus: bundle.thesis.review_status,
    primaryFile: bundle.primaryFile
      ? {
          fileName: getStorageFileName(bundle.primaryFile.storage_path),
          fileSize: null,
          pdfUrl: `/api/theses/${bundle.thesis.id}/file`,
        }
      : null,
    fieldComments: comments,
    auditEvents: audits,
  };
}

function mapListItem(
  thesis: ThesisRow,
  authors: AuthorRow[],
  commentCount: number,
): ReviewSubmissionListItem {
  return {
    id: thesis.id,
    title: thesis.title,
    authors: authors
      .filter((author) => author.thesis_id === thesis.id && author.contribution_role === "author")
      .map((author) => author.display_name),
    department: thesis.department,
    studyType: thesis.study_type,
    submittedAt: thesis.created_at,
    reviewStatus: thesis.review_status,
    year: thesis.year,
    researchArea: thesis.research_area,
    abstractPreview: thesis.abstract ?? "",
    commentCount,
  };
}

async function loadListAuthorsAndCommentCounts(thesisIds: number[]) {
  if (thesisIds.length === 0) {
    return {
      authors: [] as AuthorRow[],
      totalCommentCounts: new Map<number, number>(),
      openCommentCounts: new Map<number, number>(),
    };
  }

  const supabase = await createClient();
  const [authorsResult, commentsResult] = await Promise.all([
    supabase
      .from("thesis_authors")
      .select("id, thesis_id, user_id, display_name, contribution_role, sort_order")
      .in("thesis_id", thesisIds)
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("id", { ascending: true }),
    supabase
      .from("thesis_review_comments")
      .select("thesis_id, addressed_at")
      .in("thesis_id", thesisIds),
  ]);

  if (
    authorsResult.error
    || (
      commentsResult.error
      && !isMissingReviewCommentsTable(commentsResult.error)
    )
  ) {
    throw makeError("SUPABASE_ERROR", "Review list data could not be loaded.");
  }

  const totalCommentCounts = new Map<number, number>();
  const openCommentCounts = new Map<number, number>();
  const commentRows = isMissingReviewCommentsTable(commentsResult.error)
    ? []
    : (commentsResult.data ?? []) as Array<{
    thesis_id: number;
    addressed_at: string | null;
  }>;

  for (const comment of commentRows) {
    totalCommentCounts.set(
      comment.thesis_id,
      (totalCommentCounts.get(comment.thesis_id) ?? 0) + 1,
    );

    if (!comment.addressed_at) {
      openCommentCounts.set(
        comment.thesis_id,
        (openCommentCounts.get(comment.thesis_id) ?? 0) + 1,
      );
    }
  }

  return {
    authors: (authorsResult.data ?? []) as AuthorRow[],
    totalCommentCounts,
    openCommentCounts,
  };
}

export async function listReviewSubmissions(
  params: ReviewSubmissionListParams = {},
): Promise<ServiceResult<ReviewSubmissionListItem[]>> {
  try {
    await requireRole(["admin", "moderator"]);

    if (params.reviewStatus && !isReviewStatus(params.reviewStatus)) {
      return err(makeError("VALIDATION_FAILED", "A valid review status is required."));
    }
    if (params.department && !isDepartment(params.department)) {
      return err(
        makeError("VALIDATION_FAILED", "Department must be CS, IT, or IS."),
      );
    }

    const page = normalizedPage(params.page);
    const limit = normalizedLimit(params.limit);
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const supabase = await createClient();
    let query = supabase
      .from("theses")
      .select(`
        id,
        title,
        abstract,
        year,
        department,
        research_area,
        review_status,
        publication_date,
        publication_link,
        conference,
        recommendations,
        lessons_learned,
        submitted_by_user_id,
        created_at,
        updated_at,
        study_type
      `, { count: "exact" })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to);

    if (params.reviewStatus) {
      query = query.eq("review_status", params.reviewStatus);
    } else {
      query = query.neq("review_status", "trashed");
    }

    if (params.department) {
      query = query.eq("department", params.department);
    }

    if (params.q?.trim()) {
      query = query.ilike("title", `%${params.q.trim()}%`);
    }

    const { data, count, error } = await query;
    if (error) {
      return err(makeError("SUPABASE_ERROR", "Review submissions could not be loaded."));
    }

    const theses = (data ?? []) as ThesisRow[];
    const ids = theses.map((thesis) => thesis.id);
    const { authors, totalCommentCounts } = await loadListAuthorsAndCommentCounts(ids);

    return ok(
      theses.map((thesis) =>
        mapListItem(thesis, authors, totalCommentCounts.get(thesis.id) ?? 0),
      ),
      {
        total_count: count ?? 0,
        page,
        limit,
      },
    );
  } catch (error) {
    return err(
      normalizeServiceError(error, "Review submissions could not be loaded."),
    );
  }
}

export async function getReviewSubmission(
  thesisId: number,
): Promise<ServiceResult<ReviewSubmission>> {
  try {
    const validationError = validateThesisId(thesisId);
    if (validationError) {
      return err(validationError);
    }

    await requireRole(["admin", "moderator"]);
    return ok(await loadReviewSubmission(thesisId));
  } catch (error) {
    return err(
      normalizeServiceError(error, "Review submission could not be loaded."),
    );
  }
}

export async function addReviewComment(
  input: AddReviewCommentInput,
): Promise<ServiceResult<ReviewComment>> {
  try {
    const validationError = validateThesisId(input.thesisId);
    if (validationError) {
      return err(validationError);
    }

    await requireRole(["admin", "moderator"]);

    if (!isReviewField(input.fieldKey)) {
      return err(makeError("VALIDATION_FAILED", "A valid review field is required."));
    }

    const comment = input.comment.trim();
    if (!comment) {
      return err(makeError("VALIDATION_FAILED", "A review comment is required."));
    }

    const supabase = await createClient();
    const { data: commentId, error: rpcError } = await supabase.rpc(
      "add_review_comment",
      {
        target_thesis_id: input.thesisId,
        target_field_key: input.fieldKey,
        comment_body: comment,
      },
    );

    if (rpcError || !commentId) {
      return err(mutationError(rpcError, "The review comment could not be added."));
    }

    const submission = await loadReviewSubmission(input.thesisId);
    const createdComment = submission.fieldComments.find((item) => item.id === Number(commentId));
    if (!createdComment) {
      return err(makeError("NOT_FOUND", "The review comment could not be loaded."));
    }

    return ok(createdComment);
  } catch (error) {
    return err(
      normalizeServiceError(error, "The review comment could not be added."),
    );
  }
}

export async function setReviewStatus(
  input: SetReviewStatusInput,
): Promise<ServiceResult<ReviewSubmission>> {
  try {
    const validationError = validateThesisId(input.thesisId);
    if (validationError) {
      return err(validationError);
    }

    await requireRole(["admin", "moderator"]);

    if (!["for_review", "flagged", "accepted", "trashed"].includes(input.nextStatus)) {
      return err(makeError("VALIDATION_FAILED", "A valid next review status is required."));
    }

    const supabase = await createClient();
    const { error: rpcError } = await supabase.rpc("set_review_status", {
      target_thesis_id: input.thesisId,
      next_status: input.nextStatus,
    });

    if (rpcError) {
      return err(mutationError(rpcError, "The review status could not be changed."));
    }

    return ok(await loadReviewSubmission(input.thesisId));
  } catch (error) {
    return err(
      normalizeServiceError(error, "The review status could not be changed."),
    );
  }
}

export async function adminUpdateSubmissionMetadata(
  input: AdminUpdateSubmissionMetadataInput,
): Promise<ServiceResult<ReviewSubmission>> {
  try {
    const validationError = validateThesisId(input.thesisId);
    if (validationError) {
      return err(validationError);
    }

    const payloadError = validateUpdatePayload(input.values);
    if (payloadError) {
      return err(payloadError);
    }

    const correctionReason = input.correctionReason.trim();
    if (!correctionReason) {
      return err(makeError("VALIDATION_FAILED", "A correction reason is required."));
    }

    if (correctionReason.length > 500) {
      return err(makeError("VALIDATION_FAILED", "The correction reason must be 500 characters or fewer."));
    }

    await requireRole(["admin"]);

    const supabase = await createClient();
    const { error: rpcError } = await supabase.rpc(
      "admin_update_submission_metadata",
      {
        target_thesis_id: input.thesisId,
        payload: buildUpdatePayload(input.values),
        correction_reason: correctionReason,
      },
    );

    if (rpcError) {
      return err(mutationError(rpcError, "The submission metadata could not be corrected."));
    }

    return ok(await loadReviewSubmission(input.thesisId));
  } catch (error) {
    return err(
      normalizeServiceError(error, "The submission metadata could not be corrected."),
    );
  }
}

export async function listOwnSubmissions(
  params: OwnSubmissionListParams = {},
): Promise<ServiceResult<MySubmissionListItem[]>> {
  try {
    const user = await requireSession();

    if (params.status && params.status !== "all" && !isReviewStatus(params.status)) {
      return err(makeError("VALIDATION_FAILED", "A valid review status is required."));
    }

    const supabase = await createClient();
    let query = supabase
      .from("theses")
      .select(`
        id,
        title,
        abstract,
        year,
        department,
        research_area,
        review_status,
        publication_date,
        publication_link,
        conference,
        recommendations,
        lessons_learned,
        submitted_by_user_id,
        created_at,
        updated_at,
        study_type
      `)
      .eq("submitted_by_user_id", user.id)
      .order("updated_at", { ascending: false })
      .order("id", { ascending: false });

    if (params.status && params.status !== "all") {
      query = query.eq("review_status", params.status);
    } else {
      query = query.neq("review_status", "trashed");
    }

    if (params.q?.trim()) {
      query = query.ilike("title", `%${params.q.trim()}%`);
    }

    const { data, error } = await query;
    if (error) {
      return err(makeError("SUPABASE_ERROR", "Your submissions could not be loaded."));
    }

    const theses = (data ?? []) as ThesisRow[];
    const ids = theses.map((thesis) => thesis.id);
    const {
      authors,
      totalCommentCounts,
      openCommentCounts,
    } = await loadListAuthorsAndCommentCounts(ids);

    return ok(
      theses.map((thesis) => ({
        ...mapListItem(thesis, authors, totalCommentCounts.get(thesis.id) ?? 0),
        flaggedCommentCount:
          thesis.review_status === "flagged"
            ? openCommentCounts.get(thesis.id) ?? 0
            : 0,
      })),
    );
  } catch (error) {
    return err(
      normalizeServiceError(error, "Your submissions could not be loaded."),
    );
  }
}

export async function getOwnSubmissionForCorrection(
  thesisId: number,
): Promise<ServiceResult<ReviewSubmission>> {
  try {
    const validationError = validateThesisId(thesisId);
    if (validationError) {
      return err(validationError);
    }

    const user = await requireSession();
    if (user.role !== "member") {
      return err(makeError("FORBIDDEN", "An active member account is required."));
    }
    await requireOwnership(thesisId, user.id);

    return ok(await loadReviewSubmission(thesisId));
  } catch (error) {
    return err(
      normalizeServiceError(error, "Your submission could not be loaded."),
    );
  }
}

export async function updateFlaggedSubmission(
  input: UpdateFlaggedSubmissionInput,
): Promise<ServiceResult<ReviewSubmission>> {
  try {
    const validationError = validateThesisId(input.thesisId);
    if (validationError) {
      return err(validationError);
    }

    const payloadError = validateUpdatePayload(input.values);
    if (payloadError) {
      return err(payloadError);
    }

    const user = await requireSession();
    if (user.role !== "member") {
      return err(makeError("FORBIDDEN", "An active member account is required."));
    }
    await requireOwnership(input.thesisId, user.id);

    const supabase = await createClient();
    const { error: rpcError } = await supabase.rpc("update_flagged_submission", {
      target_thesis_id: input.thesisId,
      payload: buildUpdatePayload(input.values),
    });

    if (rpcError) {
      return err(mutationError(rpcError, "Your submission changes could not be saved."));
    }

    return ok(await loadReviewSubmission(input.thesisId));
  } catch (error) {
    return err(
      normalizeServiceError(error, "Your submission changes could not be saved."),
    );
  }
}

export async function markReviewCommentAddressed(input: {
  thesisId: number;
  commentId: number;
}): Promise<ServiceResult<ReviewComment>> {
  try {
    const thesisValidationError = validateThesisId(input.thesisId);
    if (thesisValidationError) {
      return err(thesisValidationError);
    }

    if (!isPositiveInteger(input.commentId)) {
      return err(makeError("VALIDATION_FAILED", "A valid review comment id is required."));
    }

    const user = await requireSession();
    if (user.role !== "member") {
      return err(makeError("FORBIDDEN", "An active member account is required."));
    }
    await requireOwnership(input.thesisId, user.id);

    const supabase = await createClient();
    const { error: rpcError } = await supabase.rpc("mark_review_comment_addressed", {
      target_thesis_id: input.thesisId,
      target_comment_id: input.commentId,
    });

    if (rpcError) {
      return err(mutationError(rpcError, "The review comment could not be marked addressed."));
    }

    const submission = await loadReviewSubmission(input.thesisId);
    const updatedComment = submission.fieldComments.find((item) => item.id === input.commentId);
    if (!updatedComment) {
      return err(makeError("NOT_FOUND", "The review comment could not be loaded."));
    }

    return ok(updatedComment);
  } catch (error) {
    return err(
      normalizeServiceError(error, "The review comment could not be marked addressed."),
    );
  }
}

export async function replaceFlaggedSubmissionPdf(input: {
  thesisId: number;
  file: File;
}): Promise<ServiceResult<ReviewSubmission>> {
  try {
    const validationError = validateThesisId(input.thesisId);
    if (validationError) {
      return err(validationError);
    }

    const fileValidationError = await validateThesisPdf(input.file);
    if (fileValidationError) {
      return err(makeError("VALIDATION_FAILED", fileValidationError));
    }

    const user = await requireSession();
    if (user.role !== "member") {
      return err(makeError("FORBIDDEN", "An active member account is required."));
    }
    await requireOwnership(input.thesisId, user.id);

    let storedFile: { filePath: string };
    try {
      storedFile = await uploadThesisFileToStorage(input.file, user.id);
    } catch (uploadError) {
      return err(
        makeError(
          "SUPABASE_ERROR",
          uploadError instanceof Error
            ? uploadError.message
            : "The corrected PDF could not be uploaded.",
        ),
      );
    }

    const supabase = await createClient();
    const { error: rpcError } = await supabase.rpc(
      "replace_flagged_submission_file",
      {
        target_thesis_id: input.thesisId,
        target_storage_path: storedFile.filePath,
        target_file_type: THESIS_PDF_MIME_TYPE,
      },
    );

    if (rpcError) {
      const cleanupError = await removeThesisFileFromStorage(storedFile.filePath);
      const operationError = mutationError(
        rpcError,
        "The corrected PDF could not be attached.",
      );
      return err({
        ...operationError,
        ...(cleanupError
          ? {
              details: {
                ...(operationError.details ?? {}),
                storage_cleanup_error: cleanupError,
              },
            }
          : {}),
      });
    }

    return ok(await loadReviewSubmission(input.thesisId));
  } catch (error) {
    return err(
      normalizeServiceError(error, "The corrected PDF could not be attached."),
    );
  }
}

export async function resubmitFlaggedSubmission(
  thesisId: number,
): Promise<ServiceResult<ReviewSubmission>> {
  try {
    const validationError = validateThesisId(thesisId);
    if (validationError) {
      return err(validationError);
    }

    const user = await requireSession();
    if (user.role !== "member") {
      return err(makeError("FORBIDDEN", "An active member account is required."));
    }
    await requireOwnership(thesisId, user.id);

    const supabase = await createClient();
    const { error: rpcError } = await supabase.rpc("resubmit_flagged_submission", {
      target_thesis_id: thesisId,
    });

    if (rpcError) {
      return err(mutationError(rpcError, "Your submission could not be resubmitted."));
    }

    const submission = await loadReviewSubmission(thesisId);
    if (submission.reviewStatus !== "for_review") {
      return err(
        makeError(
          "SUPABASE_ERROR",
          "Your submission was not returned to the review queue. Please try again.",
        ),
      );
    }

    return ok(submission);
  } catch (error) {
    return err(
      normalizeServiceError(error, "Your submission could not be resubmitted."),
    );
  }
}
