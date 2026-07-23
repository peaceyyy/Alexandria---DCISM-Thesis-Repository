"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import styles from "./data-table.module.css";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  title: string;
  columns: Column<T>[];
  data: T[];
  pageSize?: number;
  /** Optional right-side header element (e.g. an "Add" button) */
  headerAction?: ReactNode;
  /** Locks only this table's columns so row content cannot shift the layout. */
  columnWidths?: string[];
  /** Unique key identifier for each row */
  rowKey: keyof T;
  /** Controlled page number for server-paginated data. */
  page?: number;
  /** Controlled total page count for server-paginated data. */
  totalPages?: number;
  /** Receives controlled page changes instead of slicing data locally. */
  onPageChange?: (page: number) => void;
}

export function DataTable<T extends object>({
  title,
  columns,
  data,
  pageSize = 5,
  headerAction,
  columnWidths,
  rowKey,
  page: controlledPage,
  totalPages: controlledTotalPages,
  onPageChange,
}: DataTableProps<T>) {
  const [localPage, setLocalPage] = useState(1);
  const isControlled = controlledPage !== undefined;
  const page = controlledPage ?? localPage;
  const totalPages = isControlled
    ? Math.max(1, controlledTotalPages ?? 1)
    : Math.max(1, Math.ceil(data.length / pageSize));
  const visibleData = isControlled
    ? data
    : data.slice((page - 1) * pageSize, page * pageSize);

  function changePage(nextPage: number) {
    const boundedPage = Math.min(totalPages, Math.max(1, nextPage));
    if (onPageChange) {
      onPageChange(boundedPage);
      return;
    }

    setLocalPage(boundedPage);
  }

  return (
    <section className={styles.wrapper}>
      {/* Table header */}
      <div className={styles.tableHeader}>
        <h2 className={styles.tableTitle}>{title}</h2>
        {headerAction && <div>{headerAction}</div>}
      </div>

      {/* Scrollable table area */}
      <div className={styles.tableScroll}>
        <table
          className={styles.table}
          aria-label={title}
          style={columnWidths ? { tableLayout: "fixed" } : undefined}
        >
          {columnWidths && (
            <colgroup>
              {columns.map((column, index) => (
                <col key={String(column.key)} style={{ width: columnWidths[index] }} />
              ))}
            </colgroup>
          )}
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={String(col.key)} scope="col" className={`${styles.th} ${col.className ?? ""}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className={styles.empty}>
                  No records found.
                </td>
              </tr>
            ) : (
              visibleData.map((row) => (
                <tr key={String(row[rowKey])} className={styles.tr}>
                  {columns.map((col) => (
                    <td key={String(col.key)} className={`${styles.td} ${col.className ?? ""}`}>
                      {col.render
                        ? col.render(row)
                        : (row[col.key as keyof T] as ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className={styles.pagination}>
        <span className={styles.pageInfo}>
          Page {page} of {totalPages}
        </span>
        <div className={styles.pageControls}>
          <button
            type="button"
            className={styles.pageBtn}
            onClick={() => changePage(page - 1)}
            disabled={page === 1}
            aria-label="Previous page"
          >
            <ChevronLeft size={14} aria-hidden />
            Previous
          </button>
          <button
            type="button"
            className={styles.pageBtn}
            onClick={() => changePage(page + 1)}
            disabled={page === totalPages}
            aria-label="Next page"
          >
            Next
            <ChevronRight size={14} aria-hidden />
          </button>
        </div>
      </div>
    </section>
  );
}
