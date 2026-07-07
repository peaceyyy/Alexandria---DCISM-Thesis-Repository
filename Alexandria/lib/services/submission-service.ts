"use server";

import { createClient } from "../supabase/server";
import {
  removeThesisFileFromStorage,
  uploadThesisFileToStorage,
} from "../upload/storage-helper";
import type { StoredThesisFile } from "../upload/storage-helper";
import {
  THESIS_PDF_MIME_TYPE,
  validateThesisPdf,
} from "../upload/file-validation";
import { err, makeError, ok } from "./result";
import { requireSession, requireOwnership } from "./_guards";
import type {
  SubmitThesisInput,
  SubmitThesisPayload,
  updateThesisStatusPayload,
  RegisterFilePayload,
  ServiceResult,
  ThesisDetail,
} from "./types";

const APPLICATION_TIME_ZONE = "Asia/Manila";
const ISO_CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

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

/**
 * Server service: getOwnSubmissions()
 * Returns a list of all theses submitted by the current user.
 * This allows members to see their own pending (`for_review`), `flagged`, or `accepted` submissions,
 * which do not appear in the public catalog until accepted.
 * Used by: "My Submissions" page or dashboard.
 */
export async function getOwnSubmissions(): Promise<ServiceResult<ThesisDetail[]>> {
  try {
    const user = await requireSession();
    const supabase = await createClient();

    const { data: theses, error } = await supabase
      .from("theses")
      .select(`
        id,
        title,
        year,
        abstract,
        department,
        research_area,
        publication_date,
        publication_link,
        conference,
        recommendations,
        lessons_learned,
        review_status,
        thesis_authors (
          id,
          user_id,
          display_name,
          contribution_role,
          sort_order
        ),
        thesis_tags (
          tag
        ),
        thesis_files (
          id,
          is_primary
        )
      `)
      .eq("submitted_by_user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      return err(makeError("SUPABASE_ERROR", error.message));
    }

    const thesisDetails: ThesisDetail[] = (theses || []).map((thesis: any) => ({
      id: thesis.id,
      title: thesis.title,
      year: thesis.year,
      abstract: thesis.abstract,
      abstract_preview: thesis.abstract?.substring(0, 200) || "",
      department: thesis.department,
      research_area: thesis.research_area,
      publication_date: thesis.publication_date,
      publication_link: thesis.publication_link,
      conference: thesis.conference,
      recommendations: thesis.recommendations,
      lessons_learned: thesis.lessons_learned,
      authors: thesis.thesis_authors.map((a: any) => ({
        id: a.id,
        user_id: a.user_id,
        display_name: a.display_name,
        contribution_role: a.contribution_role,
        sort_order: a.sort_order,
      })),
      tags: thesis.thesis_tags.map((t: any) => t.tag),
      file_access: {
        has_primary_file: thesis.thesis_files?.some((f: any) => f.is_primary) || false,
        preview_path: `/api/theses/${thesis.id}/file`,
        download_path:
          thesis.review_status === "accepted"
            ? `/api/theses/${thesis.id}/file?download=1`
            : null,
        download_requires_auth: true,
      },
      related_theses: [], // Empty for own submissions list
    }));

    return ok(thesisDetails);
  } catch (e: any) {
    return err(e);
  }
}

/**
 * Server action: submitThesis(FormData)
 * Creates a new thesis record with review_status = 'for_review'.
 * Authenticates before uploading and submits metadata plus file as one packet.
 * Removes the uploaded storage object if the database RPC fails.
 * Inserts authors and advisers into thesis_authors.
 * Used by: Submit Thesis page.
 */
export async function submitThesis(
  submissionPacket: FormData,
): Promise<ServiceResult<{ id: number }>> {
  try {
    const user = await requireSession();
    const supabase = await createClient();

    const serializedPayload = submissionPacket.get("payload");
    const file = submissionPacket.get("file");

    if (typeof serializedPayload !== "string") {
      return err(makeError("VALIDATION_FAILED", "Submission metadata is required"));
    }

    if (!(file instanceof File)) {
      return err(makeError("VALIDATION_FAILED", "A thesis PDF is required"));
    }

    const fileValidationError = await validateThesisPdf(file);
    if (fileValidationError) {
      return err(makeError("VALIDATION_FAILED", fileValidationError));
    }

    let input: SubmitThesisInput;
    try {
      const parsedPayload: unknown = JSON.parse(serializedPayload);
      if (
        !parsedPayload ||
        typeof parsedPayload !== "object" ||
        Array.isArray(parsedPayload)
      ) {
        return err(makeError("VALIDATION_FAILED", "Submission metadata is invalid"));
      }
      input = parsedPayload as SubmitThesisInput;
    } catch {
      return err(makeError("VALIDATION_FAILED", "Submission metadata is invalid"));
    }

    // Validate payload before any insertion
    if (!input.authors || input.authors.length === 0) {
      return err(makeError("VALIDATION_FAILED", "At least one author is required"));
    }

    if (!input.tags || input.tags.length === 0) {
      return err(makeError("VALIDATION_FAILED", "At least one tag is required"));
    }

    if (!input.study_type || !["thesis", "capstone"].includes(input.study_type)) {
      return err(makeError("VALIDATION_FAILED", "Study type must be either 'thesis' or 'capstone'"));
    }

    const currentCalendarDate = getCurrentCalendarDate();
    if (
      !input.publication_date ||
      !isValidCalendarDate(input.publication_date)
    ) {
      return err(
        makeError("VALIDATION_FAILED", "Publication date must be a valid date"),
      );
    }

    if (input.publication_date > currentCalendarDate) {
      return err(
        makeError(
          "VALIDATION_FAILED",
          "Publication date cannot be later than today",
        ),
      );
    }

    const publicationYear = Number(input.publication_date.slice(0, 4));

    let storedFile: StoredThesisFile;
    try {
      storedFile = await uploadThesisFileToStorage(file, user.id);
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : "Failed to upload the thesis file";
      return err(makeError("SUPABASE_ERROR", message));
    }

    const payload: SubmitThesisPayload = {
      ...input,
      year: publicationYear,
      storage_path: storedFile.filePath,
      file_type: THESIS_PDF_MIME_TYPE,
    };

    // The related database inserts remain atomic inside the RPC.
    const { data: thesisId, error: rpcError } = await supabase.rpc(
      "submit_thesis_transaction",
      {
        payload,
      }
    );

    if (rpcError || !thesisId) {
      const cleanupError = await removeThesisFileFromStorage(storedFile.filePath);
      return err(
        makeError(
          "SUPABASE_ERROR",
          "The thesis submission could not be completed.",
          cleanupError ? { storage_cleanup_error: cleanupError } : undefined,
        ),
      );
    }

    return ok({ id: thesisId });
  } catch (e: any) {
    return err(e);
  }
}

/**
 * Future HTTP equivalent: POST /api/theses/:id/files
 * Registers a PDF file URL for a thesis the member owns.
 * If is_primary = true, clears the primary flag on any existing primary file.
 * Used by: Future file attachment flow for an existing thesis.
 */
export async function registerThesisFile(
  thesisId: number,
  payload: RegisterFilePayload,
): Promise<ServiceResult<null>> {
  try {
    const user = await requireSession();
    await requireOwnership(thesisId, user.id);

    const supabase = await createClient();

    // If setting as primary, clear existing primary
    if (payload.is_primary) {
      const { error: clearError } = await supabase
        .from("thesis_files")
        .update({ is_primary: false })
        .eq("thesis_id", thesisId)
        .eq("is_primary", true);

      if (clearError) {
        return err(makeError("SUPABASE_ERROR", clearError.message));
      }
    }

    // Insert new file
    const { error: insertError } = await supabase
      .from("thesis_files")
      .insert({
        thesis_id: thesisId,
        storage_path: payload.storage_path,
        is_primary: payload.is_primary,
      });

    if (insertError) {
      return err(makeError("SUPABASE_ERROR", insertError.message));
    }

    return ok(null);
  } catch (e: any) {
    return err(e);
  }
}

/**
 * Future HTTP equivalent: PATCH /api/theses/:id
 * Updates an existing thesis owned by the current user.
 * Members may only update their own submission when review_status = 'flagged'.
 * Ownership is checked against theses.submitted_by_user_id.
 * Accepts partial payloads.
 * Used by: Member edit-after-flag flow.
 */
export async function updateOwnSubmission(
  id: number,
  payload: updateThesisStatusPayload,
): Promise<ServiceResult<null>> {
  try {
    const user = await requireSession();
    await requireOwnership(id, user.id);

    const supabase = await createClient();
    const { data: thesis, error: fetchError } = await supabase
      .from("theses")
      .select("review_status")
      .eq("id", id)
      .single();

    if (fetchError || !thesis) {
      return err(makeError("NOT_FOUND", "Thesis not found"));
    }

    if (thesis.review_status !== "flagged") {
      return err(makeError("FORBIDDEN", "Only flagged submissions can be edited by members"));
    }

    // Update thesis basic fields
    const { error: updateError } = await supabase
      .from("theses")
      .update({
        title: payload.title,
        abstract: payload.abstract,
        year: payload.year,
        department: payload.department,
        research_area: payload.research_area,
        publication_date: payload.publication_date,
        publication_link: payload.publication_link,
        conference: payload.conference,
        recommendations: payload.recommendations,
        lessons_learned: payload.lessons_learned,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      return err(makeError("SUPABASE_ERROR", updateError.message));
    }

    // Handle authors/tags update if present
    if (payload.authors) {
      await supabase.from("thesis_authors").delete().eq("thesis_id", id);
      const { error: authorsError } = await supabase
        .from("thesis_authors")
        .insert(payload.authors.map((a) => ({ thesis_id: id, ...a })));
      if (authorsError) return err(makeError("SUPABASE_ERROR", authorsError.message));
    }

    if (payload.tags) {
      await supabase.from("thesis_tags").delete().eq("thesis_id", id);
      const { error: tagsError } = await supabase
        .from("thesis_tags")
        .insert(payload.tags.map((t) => ({ thesis_id: id, tag: t })));
      if (tagsError) return err(makeError("SUPABASE_ERROR", tagsError.message));
    }

    return ok(null);
  } catch (e: any) {
    return err(e);
  }
}
