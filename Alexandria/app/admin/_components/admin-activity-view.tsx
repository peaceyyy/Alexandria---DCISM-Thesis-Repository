import Link from "next/link";
import type { AdminActivityItem, PaginationMeta } from "@/lib/services/types";

const dateTimeFormatter = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : dateTimeFormatter.format(date);
}

function pageHref(page: number) {
  return page > 1 ? `/admin/activity?page=${page}` : "/admin/activity";
}

export function AdminActivityView({
  items,
  pagination,
}: {
  items: AdminActivityItem[];
  pagination: PaginationMeta;
}) {
  const totalPages = Math.max(1, Math.ceil(pagination.total_count / pagination.limit));
  const hasPreviousPage = pagination.page > 1;
  const hasNextPage = pagination.page < totalPages;

  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">Activity</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)] opacity-75">
          Audit activity across all thesis records.
        </p>
      </div>

      <section
        className="rounded-[10px] border border-[var(--color-separator)] bg-[var(--color-surface-alt)] p-5"
        aria-label="Activity history"
      >
        {items.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)] opacity-70">
            No audit activity yet.
          </p>
        ) : (
          <ol className="flex flex-col divide-y divide-[var(--color-separator)]" role="list">
            {items.map((item) => (
              <li key={item.id} className="py-4 first:pt-0 last:pb-0">
                <Link
                  href={`/admin/review/${item.thesisId}`}
                  className="block rounded-[7px] p-2 -m-2 transition hover:bg-[var(--color-text)]/5 focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-bright)]"
                  aria-label={`Open ${item.thesisTitle} review activity`}
                >
                  <p className="text-sm text-[var(--color-text)]">{item.description}</p>
                  <p className="mt-1 text-[13px] text-[var(--color-text-muted)]">
                    <span className="font-semibold text-[var(--color-text)]">
                      {item.actorName}
                    </span>
                    <span aria-hidden> · </span>
                    <span>{item.thesisTitle}</span>
                  </p>
                  <time
                    dateTime={item.occurredAt}
                    className="mt-1 block text-[12px] text-[var(--color-text-muted)] opacity-75"
                  >
                    {formatDateTime(item.occurredAt)}
                  </time>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      {pagination.total_count > pagination.limit && (
        <nav className="flex items-center justify-between gap-4" aria-label="Activity pages">
          {hasPreviousPage ? (
            <Link
              href={pageHref(pagination.page - 1)}
              className="rounded-[6px] border border-[var(--color-separator)] px-3 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-brand-bright)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-bright)]"
            >
              Previous
            </Link>
          ) : <span />}
          <p className="text-sm text-[var(--color-text-muted)]">
            Page {pagination.page} of {totalPages}
          </p>
          {hasNextPage ? (
            <Link
              href={pageHref(pagination.page + 1)}
              className="rounded-[6px] border border-[var(--color-separator)] px-3 py-2 text-sm font-semibold text-[var(--color-text)] transition hover:border-[var(--color-brand-bright)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-bright)]"
            >
              Next
            </Link>
          ) : <span />}
        </nav>
      )}
    </div>
  );
}
