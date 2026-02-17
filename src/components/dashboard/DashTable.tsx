"use client";

import { ReactNode } from "react";

type SeverityLevel = "critical" | "warning" | "info" | "success" | "muted";

interface Column<T> {
  /** Unique key for this column */
  key: string;
  /** Header label */
  header: string;
  /** Render function for cell content */
  render: (row: T, index: number) => ReactNode;
  /** Column alignment (default: left, last column defaults to right) */
  align?: "left" | "center" | "right";
  /** Optional className for header */
  headerClassName?: string;
  /** Optional className for cells */
  cellClassName?: string;
}

interface DashTableProps<T> {
  /** Data rows */
  data: T[];
  /** Column definitions */
  columns: Column<T>[];
  /** Extract unique key from row */
  getRowKey: (row: T, index: number) => string | number;
  /** Enable sticky header (opt-in) */
  stickyHeader?: boolean;
  /** Function to determine row severity for left border rail */
  getRowSeverity?: (row: T) => SeverityLevel | undefined;
  /** Empty state content */
  emptyContent?: ReactNode;
  /** Additional className for table wrapper */
  className?: string;
  /** Row click handler */
  onRowClick?: (row: T, index: number) => void;
  /** Loading state */
  loading?: boolean;
  /** Loading skeleton row count */
  loadingRows?: number;
}

/**
 * DashTable — Standardized dashboard table component.
 * Uses .dash-table CSS utilities for enterprise density styling.
 *
 * Features:
 * - Compact density with consistent header styling
 * - Optional sticky header for scrollable content
 * - Optional severity rail (left border) for row status indication
 * - Token-only colors, desktop-first
 * - Consistent hover states and typography
 */
export function DashTable<T>({
  data,
  columns,
  getRowKey,
  stickyHeader = false,
  getRowSeverity,
  emptyContent,
  className,
  onRowClick,
  loading = false,
  loadingRows = 3,
}: DashTableProps<T>) {
  const severityBorderColors: Record<SeverityLevel, string> = {
    critical: "border-l-destructive",
    warning: "border-l-amber-500",
    info: "border-l-blue-500",
    success: "border-l-green-500",
    muted: "border-l-muted-foreground/50",
  };

  if (loading) {
    return (
      <div className={["overflow-x-auto", className ?? ""].join(" ").trim()}>
        <table className="dash-table">
          <thead className={stickyHeader ? "sticky top-0 z-10" : ""}>
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={col.key}
                  className={[
                    col.headerClassName ?? "",
                    col.align === "center"
                      ? "text-center!"
                      : col.align === "right" ||
                          (idx === columns.length - 1 && !col.align)
                        ? "text-right!"
                        : "",
                  ]
                    .join(" ")
                    .trim()}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: loadingRows }).map((_, rowIdx) => (
              <tr key={rowIdx}>
                {columns.map((col) => (
                  <td key={col.key}>
                    <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={["overflow-x-auto", className ?? ""].join(" ").trim()}>
        <table className="dash-table">
          <thead className={stickyHeader ? "sticky top-0 z-10" : ""}>
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={col.key}
                  className={[
                    col.headerClassName ?? "",
                    col.align === "center"
                      ? "text-center!"
                      : col.align === "right" ||
                          (idx === columns.length - 1 && !col.align)
                        ? "text-right!"
                        : "",
                  ]
                    .join(" ")
                    .trim()}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="dash-table-empty">
              <td colSpan={columns.length}>
                {emptyContent ?? "No data available"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className={["overflow-x-auto", className ?? ""].join(" ").trim()}>
      <table className="dash-table">
        <thead className={stickyHeader ? "sticky top-0 z-10" : ""}>
          <tr>
            {columns.map((col, idx) => (
              <th
                key={col.key}
                className={[
                  col.headerClassName ?? "",
                  col.align === "center"
                    ? "text-center!"
                    : col.align === "right" ||
                        (idx === columns.length - 1 && !col.align)
                      ? "text-right!"
                      : "",
                ]
                  .join(" ")
                  .trim()}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => {
            const severity = getRowSeverity?.(row);
            const severityClass = severity
              ? `border-l-2 ${severityBorderColors[severity]}`
              : "";
            const clickable = !!onRowClick;

            return (
              <tr
                key={getRowKey(row, rowIdx)}
                className={[severityClass, clickable ? "cursor-pointer" : ""]
                  .join(" ")
                  .trim()}
                onClick={clickable ? () => onRowClick(row, rowIdx) : undefined}
                role={clickable ? "button" : undefined}
                tabIndex={clickable ? 0 : undefined}
                onKeyDown={
                  clickable
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onRowClick(row, rowIdx);
                        }
                      }
                    : undefined
                }
              >
                {columns.map((col, idx) => (
                  <td
                    key={col.key}
                    className={[
                      col.cellClassName ?? "",
                      col.align === "center"
                        ? "text-center!"
                        : col.align === "right" ||
                            (idx === columns.length - 1 && !col.align)
                          ? "text-right!"
                          : "",
                    ]
                      .join(" ")
                      .trim()}
                  >
                    {col.render(row, rowIdx)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export type { Column as DashTableColumn, SeverityLevel, DashTableProps };
