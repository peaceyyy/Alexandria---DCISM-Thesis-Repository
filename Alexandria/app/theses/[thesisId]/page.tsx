import { AppHeader } from "@/components/layout/app-header";
import { getCurrentUser } from "@/lib/services/auth-service";
import { getThesisById } from "@/lib/services/thesis-service";
import Link from "next/link";
import DetailsSidebar from "@/components/layout/details-sidebar";
import { RecommendationsPreview } from "@/components/layout/recommendations-preview";
import { ExternalLink, ArrowLeft } from "lucide-react";
import { getResearchAreaLabel } from "@/lib/domain/research-areas";

function splitList(value: string | null) {
  return value
    ? value
        .split(/\n|,/)
        .map((entry) => entry.trim())
        .filter(Boolean)
    : [];
}

export default async function ThesisDetails({
  params,
  searchParams,
}: {
  params: Promise<{ thesisId: string }>;
  searchParams: Promise<{ mine?: string | string[] }>;
}) {
  const { thesisId } = await params;
  const query = await searchParams;
  const id = Number(thesisId);

  if (!Number.isInteger(id) || id <= 0) {
    return (
      <main className="h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex items-center justify-center">
        Thesis not found
      </main>
    );
  }

  const userResult = await getCurrentUser();
  const thesisResult = await getThesisById(id, userResult.data?.id);

  const role = userResult.data?.role ?? null;

  if (thesisResult.error || !thesisResult.data) {
    return (
      <main className="h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex items-center justify-center">
        Thesis not found
      </main>
    );
  }

  const thesis = thesisResult.data;
  const researchAreas = splitList(thesis.research_area);
  const isMySubmissionView =
    (Array.isArray(query.mine) ? query.mine[0] : query.mine) === "1";
  const isOwnSubmission = thesis.submittedByUserId === userResult.data?.id;
  const ownerStatus =
    isMySubmissionView &&
    isOwnSubmission &&
    (thesis.reviewStatus === "for_review" || thesis.reviewStatus === "accepted")
      ? thesis.reviewStatus
      : null;

  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] xl:h-screen xl:overflow-hidden">
      <AppHeader role={role} />
      <div className="grid grid-cols-1 xl:h-[calc(100vh-4rem)] xl:grid-cols-[minmax(0,1fr)_320px]">

        <section className="px-4 py-5 sm:px-6 xl:overflow-y-auto xl:border-r xl:border-white/15 xl:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* this section contains the back button, title, authors, abstract, keywords/tags, pdf viewer */}

          <Link
            href={isMySubmissionView ? "/home?mine=1" : "/home"}
            className="mb-6 inline-flex h-9 items-center gap-2 rounded-full border border-[var(--color-separator-mid)] px-3 text-sm font-semibold text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-brand-bright)]/35 hover:bg-[var(--color-text)]/5 hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-bright)]/30"
          >
            <ArrowLeft size={15} aria-hidden />
            Back
          </Link>

          <div className="flex items-start gap-3">
            <h1 className="max-w-7xl text-2xl font-extrabold leading-tight text-[var(--color-text)]">
              {thesis.title}
            </h1>
            {thesis.publication_link && (
              <a
                href={
                  thesis.publication_link.startsWith("http")
                    ? thesis.publication_link
                    : `https://${thesis.publication_link}`
                }
                target="_blank"
                rel="noopener noreferrer"
                title="View original publication"
                className="mt-1 inline-flex items-center rounded p-1 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]"
              >
                <ExternalLink size={20} aria-hidden="true" />
              </a>
            )}
          </div>

          <div className="mt-2 text-sm text-[var(--color-text-muted)]">
            {thesis.authors
              .filter((author) => author.contribution_role === "author")
              .map((author) => author.display_name)
              .join(" • ")}{" "}
            | {thesis.year}
            {thesis.conference && ` | ${thesis.conference}`}
          </div>

          {ownerStatus && (
            <p
              className={
                ownerStatus === "for_review"
                  ? "mt-3 inline-flex rounded-full border border-[var(--color-chip-cyan-bd)] bg-[var(--color-chip-cyan-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--color-chip-cyan-text)]"
                  : "mt-3 inline-flex rounded-full border border-[var(--color-chip-green-bd)] bg-[var(--color-chip-green-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--color-chip-green-text)]"
              }
            >
              {ownerStatus === "for_review" ? "Under review" : "Published"}
            </p>
          )}
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              Abstract
            </h2>
            <p className="mt-2 max-w-7xl text-sm leading-6 text-[var(--color-text-muted)]">
              {thesis.abstract}
            </p>
          </div>

          {thesis.recommendations && (
            <div className="mt-6">
              <RecommendationsPreview
                recommendations={thesis.recommendations}
              />
            </div>
          )}

          <div className="mt-6">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">
              Research Area & Keywords
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {researchAreas.map((area) => (
                <span
                  key={area}
                  className="inline-flex items-center rounded-full border border-[var(--color-chip-cyan-bd)] bg-[var(--color-chip-cyan-bg)] px-3 py-1 text-xs text-[var(--color-chip-cyan-text)]"
                >
                  {getResearchAreaLabel(area)}
                </span>
              ))}
              {thesis.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-full border border-[var(--color-separator-mid)] bg-[var(--color-surface-alt)] px-3 py-1 text-xs text-[var(--color-text-muted)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <section className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-[var(--color-text)]">
                Preview
              </h2>
              {thesis.file_access.preview_path && (
                <a
                  href={thesis.file_access.preview_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open PDF in new tab"
                  title="Open in new tab"
                  className="rounded p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]"
                >
                  <ExternalLink size={16} aria-hidden />
                </a>
              )}
            </div>

            {thesis.file_access.has_primary_file &&
            thesis.file_access.preview_path ? (
              <iframe
                title={`PDF preview: ${thesis.title}`}
                src={thesis.file_access.preview_path}
                className="mt-3 h-[72vh] min-h-[32rem] w-full rounded-lg border border-[var(--color-separator-mid)] bg-[var(--color-surface)]"
              />
            ) : (
              <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                A PDF preview is not available for this thesis.
              </p>
            )}
          </section>
        </section>

        <DetailsSidebar thesis={thesis} />
      </div>
    </main>
  );
}
