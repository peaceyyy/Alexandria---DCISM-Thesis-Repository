import { AdminDashboardView } from "@/app/admin/_components/admin-dashboard-view";
import { AdminDataState } from "@/app/admin/_components/admin-data-state";
import { DASHBOARD_QUEUE_PAGE_SIZE } from "@/app/admin/_components/dashboard-constants";
import { getAdminDashboardSnapshot } from "@/lib/services/admin-dashboard-service";
import { isDepartment, type Department } from "@/lib/domain/departments";
import { isResearchAreaId, type ResearchAreaId } from "@/lib/domain/research-areas";
import { listReviewSubmissions } from "@/lib/services/review-service";
import type { ReviewSearchScope, ReviewStatus } from "@/lib/services/types";

type DashboardStatusFilter = ReviewStatus | "all";

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function parseStatus(value?: string | string[]): DashboardStatusFilter {
  const status = firstValue(value);
  return status === "for_review"
    || status === "flagged"
    || status === "accepted"
    || status === "trashed"
    ? status
    : "all";
}

function parseDepartment(value?: string | string[]): Department | undefined {
  const department = firstValue(value);
  return department && isDepartment(department) ? department : undefined;
}

function parseSearchScope(value?: string | string[]): ReviewSearchScope {
  const scope = firstValue(value);
  return scope === "author" ? scope : "title";
}

function parseResearchArea(value?: string | string[]): ResearchAreaId | undefined {
  const researchArea = firstValue(value);
  return researchArea && isResearchAreaId(researchArea) ? researchArea : undefined;
}

function parsePage(value?: string | string[]): number {
  const page = Number(firstValue(value));
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string | string[];
    department?: string | string[];
    q?: string | string[];
    scope?: string | string[];
    research_area?: string | string[];
    page?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const status = parseStatus(params.status);
  const department = parseDepartment(params.department);
  const query = firstValue(params.q)?.trim() ?? "";
  const searchScope = parseSearchScope(params.scope);
  const researchArea = parseResearchArea(params.research_area);
  const page = parsePage(params.page);
  const [snapshotResult, reviewQueueResult] = await Promise.all([
    getAdminDashboardSnapshot(),
    listReviewSubmissions({
      reviewStatus: status === "all" ? undefined : status,
      department,
      researchArea,
      q: query || undefined,
      searchScope,
      page,
      limit: DASHBOARD_QUEUE_PAGE_SIZE,
    }),
  ]);

  if (
    snapshotResult.error
    || !snapshotResult.data
  ) {
    return (
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Admin Dashboard</h1>
        <AdminDataState
          title="Dashboard unavailable"
          message={
            snapshotResult.error?.message ??
            "The dashboard data could not be loaded."
          }
        />
      </div>
    );
  }

  const reviewQueueMeta = reviewQueueResult.data
    ? reviewQueueResult.meta
    : undefined;

  return (
    <AdminDashboardView
      snapshot={snapshotResult.data}
      reviewQueue={reviewQueueResult.data ?? []}
      reviewQueueError={reviewQueueResult.error?.message ?? null}
      selectedStatus={status}
      selectedDepartment={department ?? "all"}
      query={query}
      searchScope={searchScope}
      selectedResearchArea={researchArea ?? "all"}
      reviewQueuePage={reviewQueueMeta?.page ?? page}
      reviewQueueTotalPages={Math.max(
        1,
        Math.ceil(
          (reviewQueueMeta?.total_count ?? 0) /
            DASHBOARD_QUEUE_PAGE_SIZE,
        ),
      )}
    />
  );
}
