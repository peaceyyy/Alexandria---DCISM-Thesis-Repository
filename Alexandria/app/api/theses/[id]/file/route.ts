import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/services/auth-service";
import type { ReviewStatus } from "@/lib/services/types";
import { createAdminClient } from "@/lib/supabase/admin";

const THESIS_FILES_BUCKET = "thesis_files_bucket";
const SIGNED_URL_TTL_SECONDS = 60;

type ThesisAccessRow = {
  id: number;
  title: string;
  review_status: ReviewStatus;
  submitted_by_user_id: string | null;
};

function safePdfName(title: string) {
  const normalizedTitle = title
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 100);

  return `${normalizedTitle || "thesis"}.pdf`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const thesisId = Number(rawId);

  if (!Number.isSafeInteger(thesisId) || thesisId < 1) {
    return NextResponse.json(
      { error: "Invalid thesis identifier." },
      { status: 400 },
    );
  }

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "File access is not configured." },
      { status: 500 },
    );
  }

  const [principalResult, thesisResult, fileResult] = await Promise.all([
    getCurrentUser(),
    admin
      .from("theses")
      .select("id, title, review_status, submitted_by_user_id")
      .eq("id", thesisId)
      .maybeSingle(),
    admin
      .from("thesis_files")
      .select("storage_path, file_type")
      .eq("thesis_id", thesisId)
      .eq("is_primary", true)
      .maybeSingle(),
  ]);

  if (thesisResult.error || !thesisResult.data) {
    return NextResponse.json(
      { error: "Thesis not found." },
      { status: 404 },
    );
  }

  if (
    fileResult.error
    || !fileResult.data?.storage_path
    || fileResult.data.file_type !== "application/pdf"
  ) {
    return NextResponse.json(
      { error: "A primary thesis PDF is not available." },
      { status: 404 },
    );
  }

  const thesis = thesisResult.data as ThesisAccessRow;
  const user = principalResult.data;
  const isActiveUser = Boolean(user);
  const isReviewer =
    user?.role === "admin" || user?.role === "moderator";
  const isSubmitter = user?.id === thesis.submitted_by_user_id;
  const isAccepted = thesis.review_status === "accepted";
  const isOwnerPreview =
    isSubmitter
    && ["for_review", "flagged"].includes(thesis.review_status);
  const mayPreview = isAccepted || isReviewer || isOwnerPreview;
  const wantsDownload = request.nextUrl.searchParams.get("download") === "1";
  const mayDownload =
    isActiveUser && (isAccepted || isReviewer);

  if (!mayPreview || (wantsDownload && !mayDownload)) {
    return NextResponse.json(
      { error: "You do not have access to this thesis PDF." },
      { status: 403 },
    );
  }

  const fileName = safePdfName(thesis.title);
  const { data: signedFile, error: signedFileError } = await admin.storage
    .from(THESIS_FILES_BUCKET)
    .createSignedUrl(
      fileResult.data.storage_path,
      SIGNED_URL_TTL_SECONDS,
      wantsDownload ? { download: fileName } : undefined,
    );

  if (signedFileError || !signedFile?.signedUrl) {
    return NextResponse.json(
      { error: "The thesis PDF could not be opened." },
      { status: 502 },
    );
  }

  const response = NextResponse.redirect(signedFile.signedUrl);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
