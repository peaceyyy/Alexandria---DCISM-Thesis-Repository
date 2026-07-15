"use client";

import { useState } from "react";
import type React from "react";
import Image from "next/image";
import { SlidersHorizontal } from "lucide-react";
import FaqRail from "@/components/layout/faq";
import FilterSidebar from "@/components/layout/filter-sidebar";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReviewStatus, ThesisCard } from "@/lib/services/types";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export type BrowseThesisItem = ThesisCard & {
  reviewStatus?: ReviewStatus;
  flaggedCommentCount?: number;
};

type ThesesBrowserProps = {
  items: BrowseThesisItem[];
  showMySubmissions: boolean;
  isMySubmissions: boolean;
  flaggedSubmissionCount: number;
};

const REVIEW_STATUS_META: Record<ReviewStatus, { label: string; className: string }> = {
  for_review: {
    label: "Under review",
    className: "border-[var(--color-chip-cyan-bd)] bg-[var(--color-chip-cyan-bg)] text-[var(--color-chip-cyan-text)]",
  },
  flagged: {
    label: "Needs revision",
    className: "border-[var(--color-chip-red-bd)] bg-[var(--color-chip-red-bg)] text-[var(--color-chip-red-text)]",
  },
  accepted: {
    label: "Published",
    className: "border-[var(--color-chip-green-bd)] bg-[var(--color-chip-green-bg)] text-[var(--color-chip-green-text)]",
  },
  trashed: {
    label: "Archived",
    className: "border-[var(--color-separator)] bg-[var(--color-text)]/[0.04] text-[var(--color-text-muted)]",
  },
};

function splitResearchAreas(value: string | null) {
  return value
    ? value
        .split(",")
        .map((area) => area.trim())
        .filter(Boolean)
    : [];
}

export default function ThesesBrowser({
  items,
  showMySubmissions,
  isMySubmissions,
  flaggedSubmissionCount,
}: ThesesBrowserProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [fromYear, setFromYear] = useState("");
  const [toYear, setToYear] = useState("");
  const [selectedResearchAreas, setSelectedResearchAreas] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filteredItems = items.filter((item) => {
    const yearMatch =
      (!fromYear || item.year >= Number(fromYear)) &&
      (!toYear || item.year <= Number(toYear));

    const researchAreaMatch =
      selectedResearchAreas.length === 0 ||
      selectedResearchAreas.some((area) =>
        splitResearchAreas(item.research_area).includes(area)
      );

    const departmentMatch =
      selectedDepartments.length === 0 ||
      selectedDepartments.includes(item.department);

    return yearMatch && researchAreaMatch && departmentMatch;
  });

  const toggleValue = (
    value: string,
    setValues: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setValues((current) =>
      current.includes(value)
        ? current.filter((entry) => entry !== value)
        : [...current, value]
    );
  };

  const toggleMySubmissions = () => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (isMySubmissions) {
      nextParams.delete("mine");
    } else {
      nextParams.set("mine", "1");
    }

    const query = nextParams.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  };

  const filterSidebarProps = {
    fromYear,
    toYear,
    setFromYear,
    setToYear,
    selectedResearchAreas,
    selectedDepartments,
    onToggleResearchArea: (value: string) =>
      toggleValue(value, setSelectedResearchAreas),
    onToggleDepartment: (value: string) =>
      toggleValue(value, setSelectedDepartments),
    showMySubmissions,
    mySubmissionsActive: isMySubmissions,
    flaggedSubmissionCount,
    onToggleMySubmissions: toggleMySubmissions,
  };

  return (
    <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 xl:h-[calc(100vh-4rem)] xl:grid-cols-[220px_minmax(0,1fr)_320px]">
      <FilterSidebar className="hidden xl:block" {...filterSidebarProps} />

      <section className="px-4 py-5 sm:px-6 xl:overflow-y-auto xl:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="mb-5 flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-4 xl:hidden">
          <p className="text-xs font-medium text-[var(--color-text-muted)]">
            {filteredItems.length} {filteredItems.length === 1 ? "study" : "studies"}
          </p>
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="inline-flex min-h-10 items-center gap-2 border border-[var(--color-border-subtle)] px-3 text-sm font-semibold text-[var(--color-text)] transition-colors hover:border-[#368bfe]/70 hover:bg-[var(--color-text)]/[0.04]"
          >
            <SlidersHorizontal size={16} aria-hidden />
            Filters
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item) => {
            const statusMeta = item.reviewStatus
              ? REVIEW_STATUS_META[item.reviewStatus]
              : null;
            const card = (
              <article
                className="group flex h-[440px] flex-col overflow-hidden rounded-xl border border-[var(--color-separator)] bg-[var(--color-text)]/[0.03] p-5 transition hover:-translate-y-0.5 hover:border-[var(--color-text)]/20 hover:bg-[var(--color-text)]/[0.04]"
              >
                {/* Thumbnail — fixed height, never shrinks */}
                <div className="mb-4 flex-shrink-0 overflow-hidden rounded-lg border border-[var(--color-separator)] bg-[var(--color-text)]/5">
                  <Image
                    src="/placeholder.svg"
                    alt="Article preview"
                    width={640}
                    height={360}
                    className="h-36 w-full object-cover"
                  />
                </div>

                {/* Authors — single line, never wraps */}
                <div className="mb-3 flex min-h-5 items-center gap-2">
                  <div className="min-w-0 flex-1 truncate text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">
                    {item.authors.map((a) => a.display_name).join(" • ")} | {item.year}
                  </div>
                  {statusMeta && (
                    <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusMeta.className}`}>
                      {statusMeta.label}
                    </span>
                  )}
                </div>

                {/* Title — 2-line max */}
                <h2 className="mb-2 flex-shrink-0 line-clamp-2 text-[17px] font-extrabold leading-tight text-[var(--color-text)]">
                  {item.title}
                </h2>

                {/* Abstract — flex-grow to fill space, clamps at ~5 lines */}
                <p className="flex-grow overflow-hidden line-clamp-5 text-sm leading-relaxed text-[var(--color-text-muted)]">
                  {item.abstract_preview}
                </p>

                {item.reviewStatus === "flagged" && item.flaggedCommentCount ? (
                  <p className="mt-3 text-[11px] font-medium text-[var(--color-danger)]">
                    {item.flaggedCommentCount} moderator comment{item.flaggedCommentCount === 1 ? "" : "s"}
                  </p>
                ) : null}

                {/* Tags — always at the bottom, single-row, overflow-hidden */}
                {(() => {
                  const researchAreas = splitResearchAreas(item.research_area);
                  const visibleTags = item.tags.slice(0, 3);
                  const remainingResearchAreas = researchAreas.length - 1;
                  const remainingTags = item.tags.length - visibleTags.length;

                  return (
                    <div className="mt-auto pt-4 flex-shrink-0 flex flex-wrap items-center gap-2">
                      {researchAreas[0] && (
                        <span
                          title={researchAreas[0]}
                          className="flex-shrink-0 max-w-[9rem] truncate rounded-full border border-[var(--color-chip-cyan-bd)] bg-[var(--color-chip-cyan-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-chip-cyan-text)]"
                        >
                          {researchAreas[0]}
                        </span>
                      )}
                      {remainingResearchAreas > 0 && (
                        <span
                          title={`${remainingResearchAreas} more research area${remainingResearchAreas === 1 ? "" : "s"}`}
                          aria-label={`${remainingResearchAreas} more research area${remainingResearchAreas === 1 ? "" : "s"}`}
                          className="flex-shrink-0 inline-flex size-5 items-center justify-center rounded-full border border-[var(--color-chip-cyan-bd)] bg-[var(--color-chip-cyan-bg)] text-[10px] font-semibold text-[var(--color-chip-cyan-text)]"
                        >
                          +{remainingResearchAreas}
                        </span>
                      )}
                      {visibleTags.map((tag) => (
                        <span
                          key={tag}
                          title={tag}
                          className="flex-shrink-0 max-w-[6rem] truncate rounded-full border border-[var(--color-separator)] bg-[var(--color-text)]/[0.04] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-muted)]"
                        >
                          {tag}
                        </span>
                      ))}
                      {remainingTags > 0 && (
                        <span
                          title={`${remainingTags} more tag${remainingTags === 1 ? "" : "s"}`}
                          aria-label={`${remainingTags} more tag${remainingTags === 1 ? "" : "s"}`}
                          className="flex-shrink-0 inline-flex size-5 items-center justify-center rounded-full border border-[var(--color-separator)] bg-[var(--color-text)]/[0.04] text-[10px] font-semibold text-[var(--color-text-muted)]"
                        >
                          +{remainingTags}
                        </span>
                      )}
                    </div>
                  );
                })()}
              </article>
            );

            return item.reviewStatus === "flagged" ? (
              <Link
                key={item.id}
                href={`/submissions/${item.id}/corrections`}
                className="block"
                aria-label={`Correct flagged submission: ${item.title}`}
              >
                {card}
              </Link>
            ) : item.reviewStatus && item.reviewStatus !== "accepted" ? (
              <div key={item.id}>{card}</div>
            ) : (
              <Link key={item.id} href={`/theses/${item.id}`} className="block">
                {card}
              </Link>
            );
          })}
        </div>

        <div className="mt-8 border-t border-[var(--color-border-subtle)] pt-2 xl:hidden">
          <FaqRail />
        </div>
      </section>

      <div className="hidden xl:block">
        <FaqRail />
      </div>

      <Dialog open={filtersOpen} onOpenChange={(open) => setFiltersOpen(open)}>
        <DialogContent
          className="!left-0 !top-0 h-dvh w-[min(22rem,calc(100%-2rem))] !max-w-none !translate-x-0 !translate-y-0 gap-0 overflow-y-auto rounded-none border-r border-[var(--color-border-subtle)] bg-[var(--color-bg)] p-0 text-[var(--color-text)]"
        >
          <div className="border-b border-[var(--color-border-subtle)] px-5 py-5">
            <DialogTitle className="font-semibold text-[var(--color-text)]">Filter studies</DialogTitle>
          </div>
          <FilterSidebar className="border-0 px-5 py-5" {...filterSidebarProps} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
