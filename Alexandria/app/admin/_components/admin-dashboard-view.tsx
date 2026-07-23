"use client";

import { BookText, Check, Clock, ListFilter, RefreshCw, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Popover } from "@base-ui/react/popover";
import { DEPARTMENTS, type Department } from "@/lib/domain/departments";
import {
  RESEARCH_AREAS,
  type ResearchAreaId,
} from "@/lib/domain/research-areas";
import { DASHBOARD_QUEUE_PAGE_SIZE } from "./dashboard-constants";
import { DataTable, type Column } from "./data-table";
import { StatCard } from "./stat-card";
import { StatusBadge } from "./status-badge";
import type {
  AdminDashboardSnapshot,
  ReviewSearchScope,
  ReviewStatus,
  ReviewSubmissionListItem,
  UserRole,
} from "@/lib/services/types";

const dateFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
});

type DashboardStatusFilter = ReviewStatus | "all";
type DashboardDepartmentFilter = Department | "all";
type DashboardResearchAreaFilter = ResearchAreaId | "all";

const SEARCH_SCOPES: Array<{
  value: ReviewSearchScope;
  label: string;
  placeholder: string;
}> = [
  { value: "title", label: "Title", placeholder: "Search titles" },
  { value: "author", label: "Author", placeholder: "Search authors" },
];

const STATUS_FILTERS: Array<{
  value: DashboardStatusFilter;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "for_review", label: "Under review" },
  { value: "flagged", label: "Needs revision" },
  { value: "accepted", label: "Published" },
  { value: "trashed", label: "Archived" },
];

const REVIEW_QUEUE_COLUMN_WIDTHS = ["31%", "27%", "12%", "11%", "9%", "10%"];

function formatDate(value: string, includeTime = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return includeTime
    ? dateTimeFormatter.format(date)
    : dateFormatter.format(date);
}

const reviewQueueColumns: Column<ReviewSubmissionListItem>[] = [
  {
    key: "title",
    header: "Title",
    className: "max-w-[260px]",
  },
  {
    key: "authors",
    header: "Authors",
    render: (row) =>
      row.authors.length > 0
        ? row.authors.slice(0, 2).join(", ")
        : "Unknown author",
  },
  {
    key: "submittedAt",
    header: "Submitted",
    render: (row) => formatDate(row.submittedAt),
  },
  {
    key: "reviewStatus",
    header: "Status",
    render: (row) => <StatusBadge status={row.reviewStatus} quietSettled />,
  },
  {
    key: "commentCount",
    header: "Comments",
  },
  {
    key: "id",
    header: "Action",
    render: (row) => (
      <Link
        href={`/admin/review/${row.id}`}
        prefetch={false}
        className="inline-flex items-center justify-center rounded-[7px] border border-[var(--color-brand-bright)]/40 bg-[var(--color-brand-bright)]/10 px-3 py-1.5 text-[12px] font-semibold text-[var(--color-brand-bright)] transition hover:border-[var(--color-brand-bright)]/70 hover:bg-[var(--color-brand-bright)]/15"
      >
        Review
      </Link>
    ),
  },
];

export function AdminDashboardView({
  snapshot,
  reviewQueue,
  reviewQueueError,
  selectedStatus,
  selectedDepartment,
  selectedResearchArea,
  query,
  searchScope,
  reviewQueuePage,
  reviewQueueTotalPages,
  viewerRole,
}: {
  snapshot: AdminDashboardSnapshot;
  reviewQueue: ReviewSubmissionListItem[];
  reviewQueueError: string | null;
  selectedStatus: DashboardStatusFilter;
  selectedDepartment: DashboardDepartmentFilter;
  selectedResearchArea: DashboardResearchAreaFilter;
  query: string;
  searchScope: ReviewSearchScope;
  reviewQueuePage: number;
  reviewQueueTotalPages: number;
  viewerRole: Extract<UserRole, "admin" | "moderator">;
}) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [searchQuery, setSearchQuery] = useState(query);
  const searchTimeoutRef = useRef<number | null>(null);
  const lastSubmittedQueryRef = useRef(query);
  const largestDepartmentCount = snapshot.research_by_department[0]?.count ?? 0;
  const visibleStatusFilters =
    viewerRole === "admin"
      ? STATUS_FILTERS
      : STATUS_FILTERS.filter((filter) => filter.value !== "trashed");

  const buildDashboardUrl = useCallback(
    (
      nextQuery: string,
      page: number,
      scope = searchScope,
      status = selectedStatus,
      department = selectedDepartment,
      researchArea = selectedResearchArea,
    ) => {
      const params = new URLSearchParams();
      const normalizedQuery = nextQuery.trim();
      if (normalizedQuery) params.set("q", normalizedQuery);
      if (scope !== "title") params.set("scope", scope);
      if (status !== "all") params.set("status", status);
      if (department !== "all") {
        params.set("department", department);
      }
      if (researchArea !== "all") {
        params.set("research_area", researchArea);
      }
      if (page > 1) params.set("page", String(page));

      const search = params.toString();
      return search ? `/admin/dashboard?${search}` : "/admin/dashboard";
    },
    [searchScope, selectedDepartment, selectedResearchArea, selectedStatus],
  );

  useEffect(() => {
    if (query === lastSubmittedQueryRef.current) return;

    setSearchQuery(query);
    lastSubmittedQueryRef.current = query;
  }, [query]);

  useEffect(() => {
    if (searchQuery.trim() === query) return;

    searchTimeoutRef.current = window.setTimeout(() => {
      const nextQuery = searchQuery.trim();
      lastSubmittedQueryRef.current = nextQuery;
      router.replace(buildDashboardUrl(nextQuery, 1, searchScope));
    }, 350);

    return () => {
      if (searchTimeoutRef.current !== null) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [buildDashboardUrl, query, router, searchQuery, searchScope]);

  function handleQueuePageChange(page: number) {
    router.push(buildDashboardUrl(query, page, searchScope));
  }

  function handleSearchScopeChange(scope: ReviewSearchScope) {
    router.replace(buildDashboardUrl(searchQuery, 1, scope));
  }

  function handleStatusChange(status: DashboardStatusFilter) {
    router.replace(buildDashboardUrl(searchQuery, 1, searchScope, status));
  }

  function handleDepartmentChange(department: DashboardDepartmentFilter) {
    router.replace(
      buildDashboardUrl(
        searchQuery,
        1,
        searchScope,
        selectedStatus,
        department,
      ),
    );
  }

  function handleResearchAreaChange(researchArea: DashboardResearchAreaFilter) {
    router.replace(
      buildDashboardUrl(
        searchQuery,
        1,
        searchScope,
        selectedStatus,
        selectedDepartment,
        researchArea,
      ),
    );
  }

  function handleRefresh() {
    startRefresh(() => router.refresh());
  }

  const activeSearchScope =
    SEARCH_SCOPES.find((scope) => scope.value === searchScope) ??
    SEARCH_SCOPES[0];

  return (
    <div className="flex flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold text-[var(--color-text)]">
        Good day,{" "}
        <span className="font-bold text-[var(--color-text)]">
          {snapshot.viewer.profile_name}
        </span>
        !
      </h1>

      <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        <StatCard
          icon={BookText}
          value={snapshot.metrics.total_research}
          label="Total Research"
        />
        <StatCard
          icon={Clock}
          value={snapshot.metrics.pending_docs}
          label="Pending Docs"
        />
      </div>

      <DataTable
        title="Submission Queue"
        columns={reviewQueueColumns}
        data={reviewQueue}
        pageSize={DASHBOARD_QUEUE_PAGE_SIZE}
        columnWidths={REVIEW_QUEUE_COLUMN_WIDTHS}
        page={reviewQueuePage}
        totalPages={reviewQueueTotalPages}
        onPageChange={handleQueuePageChange}
        rowKey="id"
        headerAction={
          <div className="flex flex-col items-end gap-2">
            {reviewQueueError && (
              <p className="max-w-[420px] text-right text-[12px] text-[var(--color-danger)]">
                {reviewQueueError}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                className="inline-flex size-9 items-center justify-center rounded-[6px] border border-[var(--color-separator)] bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] transition hover:border-[var(--color-brand-bright)]/50 hover:text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-bright)] disabled:cursor-wait disabled:opacity-60"
                aria-label="Refresh dashboard"
                title="Refresh dashboard"
                disabled={isRefreshing}
                onClick={handleRefresh}
              >
                <RefreshCw
                  size={15}
                  aria-hidden
                  className={isRefreshing ? "animate-spin" : undefined}
                />
              </button>
              <div className="relative">
                <Search
                  size={14}
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] opacity-70"
                />
                <input
                  value={searchQuery}
                  placeholder={activeSearchScope.placeholder}
                  aria-label={`Search by ${activeSearchScope.label.toLowerCase()}`}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="h-9 w-44 rounded-[6px] border border-[var(--color-separator)] bg-[var(--color-surface-alt)] py-0 pl-8 pr-3 text-[12px] text-[var(--color-text)] outline-none placeholder:text-[var(--color-placeholder)] focus:border-[var(--color-brand-bright)]"
                />
              </div>
              <span className="sr-only" aria-live="polite">
                {searchQuery.trim() !== query
                  ? `Searching ${activeSearchScope.label.toLowerCase()}s`
                  : ""}
              </span>
              <Popover.Root>
                <Popover.Trigger
                  aria-label="Choose search field"
                  title="Choose search field"
                  className="inline-flex size-9 items-center justify-center rounded-[6px] border border-[var(--color-separator)] bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] transition hover:border-[var(--color-brand-bright)]/50 hover:text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-bright)]"
                >
                  <ListFilter size={15} aria-hidden />
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Positioner align="end" side="bottom" sideOffset={8}>
                    <Popover.Popup
                      aria-label="Search and research-area filters"
                      className="z-50 w-52 rounded-[7px] border border-[var(--color-separator)] bg-[var(--color-surface)] p-1.5 text-[var(--color-text)] shadow-[0_12px_24px_rgba(0,0,0,0.28)] outline-none"
                    >
                      <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] opacity-70">
                        Search in
                      </p>
                      <div
                        className="flex flex-col gap-0.5"
                        role="group"
                        aria-label="Search field"
                      >
                        {SEARCH_SCOPES.map((scope) => {
                          const isActive = scope.value === searchScope;
                          return (
                            <button
                              key={scope.value}
                              type="button"
                              className={`flex h-8 items-center justify-between rounded-[5px] px-2 text-left text-[12px] font-medium transition ${
                                isActive
                                  ? "bg-[var(--color-brand-bright)]/14 text-[var(--color-brand-bright)]"
                                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-text)]/5"
                              }`}
                              aria-pressed={isActive}
                              onClick={() =>
                                handleSearchScopeChange(scope.value)
                              }
                            >
                              {scope.label}
                              {isActive && <Check size={14} aria-hidden />}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-2 border-t border-[var(--color-separator)] pt-2">
                        <label className="flex flex-col gap-1 px-2 text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] opacity-70">
                          Research area
                          <select
                            value={selectedResearchArea}
                            aria-label="Filter by research area"
                            onChange={(event) =>
                              handleResearchAreaChange(
                                event.target
                                  .value as DashboardResearchAreaFilter,
                              )
                            }
                            className="h-8 rounded-[5px] border border-[var(--color-separator)] bg-[var(--color-surface-alt)] px-2 text-[12px] font-medium normal-case tracking-normal text-[var(--color-text)] outline-none focus:border-[var(--color-brand-bright)]"
                          >
                            <option value="all">All research areas</option>
                            {RESEARCH_AREAS.map((area) => (
                              <option key={area.id} value={area.id}>
                                {area.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </Popover.Popup>
                  </Popover.Positioner>
                </Popover.Portal>
              </Popover.Root>
              <select
                value={selectedStatus}
                aria-label="Filter by review status"
                onChange={(event) =>
                  handleStatusChange(
                    event.target.value as DashboardStatusFilter,
                  )
                }
                className="h-9 w-36 rounded-[6px] border border-[var(--color-separator)] bg-[var(--color-surface-alt)] px-2 text-[12px] font-semibold text-[var(--color-text-muted)] outline-none focus:border-[var(--color-brand-bright)]"
              >
                {visibleStatusFilters.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
              <select
                value={selectedDepartment}
                aria-label="Filter by department"
                onChange={(event) =>
                  handleDepartmentChange(
                    event.target.value as DashboardDepartmentFilter,
                  )
                }
                className="h-9 rounded-[6px] border border-[var(--color-separator)] bg-[var(--color-surface-alt)] px-2 text-[12px] font-semibold text-[var(--color-text-muted)] outline-none focus:border-[var(--color-brand-bright)]"
              >
                <option value="all">All departments</option>
                {DEPARTMENTS.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
        <section
          className="rounded-[10px] border border-[var(--color-separator)] bg-[var(--color-surface-alt)] p-5"
          aria-label="Recent Activity"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-bold text-[var(--color-text)]">
              Recent Activity
            </h2>
            <Link
              href="/admin/activity"
              className="text-[12px] font-semibold text-[var(--color-brand-bright)] transition hover:text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-bright)] focus:ring-offset-2 focus:ring-offset-[var(--color-surface-alt)]"
            >
              View all activity
            </Link>
          </div>
          {snapshot.recent_activity.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] opacity-70">
              No audit activity yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-3" role="list">
              {snapshot.recent_activity.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/admin/review/${item.thesisId}`}
                    prefetch={false}
                    className="block rounded-[6px] p-1.5 -m-1.5 transition hover:bg-[var(--color-text)]/5 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-bright)]"
                    aria-label={`Open ${item.thesisTitle} review activity`}
                  >
                    <p className="text-sm text-[var(--color-text)]">
                      {item.description}
                    </p>
                    <p className="mt-1 text-[12px] text-[var(--color-text-muted)] opacity-80">
                      <span className="font-semibold text-[var(--color-text)]">
                        {item.actorName}
                      </span>
                      <span aria-hidden> · </span>
                      <span>{item.thesisTitle}</span>
                    </p>
                    <time
                      dateTime={item.occurredAt}
                      className="mt-1 block text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)] opacity-70"
                    >
                      {formatDate(item.occurredAt, true)}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          className="rounded-[10px] border border-[var(--color-separator)] bg-[var(--color-surface-alt)] p-5"
          aria-label="Research by Department"
        >
          <h2 className="mb-4 text-[15px] font-bold text-[var(--color-text)]">
            Research by Department
          </h2>
          {snapshot.research_by_department.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] opacity-70">
              No department totals yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-3" role="list">
              {snapshot.research_by_department.map((department) => (
                <li
                  key={department.department}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-[var(--color-text)]">
                    {department.department}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--color-separator-mid)] max-sm:hidden">
                      <div
                        className="h-full rounded-full bg-[var(--color-brand)]"
                        style={{
                          width: `${
                            largestDepartmentCount
                              ? Math.round(
                                  (department.count / largestDepartmentCount) *
                                    100,
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-bold text-[var(--color-text)] tabular-nums">
                      {department.count}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
