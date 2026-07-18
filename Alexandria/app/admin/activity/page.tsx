import { AdminActivityView } from "@/app/admin/_components/admin-activity-view";
import { AdminDataState } from "@/app/admin/_components/admin-data-state";
import {
  ADMIN_ACTIVITY_PAGE_SIZE,
  listAdminActivity,
} from "@/lib/services/admin-activity-service";

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePage(value?: string | string[]) {
  const page = Number(firstValue(value));
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const params = await searchParams;
  const result = await listAdminActivity({
    page: parsePage(params.page),
    limit: ADMIN_ACTIVITY_PAGE_SIZE,
  });

  if (result.error || !result.data || !result.meta) {
    return (
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Activity</h1>
        <AdminDataState
          title="Activity unavailable"
          message={result.error?.message ?? "The activity history could not be loaded."}
        />
      </div>
    );
  }

  return <AdminActivityView items={result.data} pagination={result.meta} />;
}
