"use client";
import { type ReactNode } from "react";

/**
 * ReconAI Design Primitives
 *
 * Self-contained, dual-mode (light/dark) design system.
 * Light mode: #fafafa bg, #ffffff card, #111827 text, #6b7280 muted, #e5e7eb border
 * Dark mode: #0a0a0b bg, #18181b card, #f9fafb text, #a1a1aa muted, #27272a border
 *
 * Usage: Import components directly. Theme toggle handled via Tailwind dark: prefix.
 */

// =============================================================================
// PAGE CONTAINER
// =============================================================================

export function PageContainer({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`
        min-h-screen p-8
        bg-[#fafafa] dark:bg-[#0a0a0b]
        ${className}
      `}
    >
      <div className="max-w-[1400px] mx-auto space-y-8">{children}</div>
    </div>
  );
}

// =============================================================================
// CARD
// =============================================================================

export function Card({
  children,
  className = "",
  noPadding = false,
}: {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
}) {
  return (
    <div
      className={`
        rounded-lg
        bg-white dark:bg-[#18181b]
        border border-[#e5e7eb] dark:border-[#27272a]
        shadow-[0_1px_3px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)]
        ${noPadding ? "" : "p-6"}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// =============================================================================
// TAB
// =============================================================================

export function Tab({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative px-2 pb-3 text-sm font-medium transition-colors
        ${active
          ? "text-[#111827] dark:text-[#f9fafb]"
          : "text-[#6b7280] dark:text-[#a1a1aa] hover:text-[#111827] dark:hover:text-[#f9fafb]"
        }
      `}
    >
      {children}
      {active && (
        <span className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-[#4f46e5] dark:bg-[#6366f1]" />
      )}
    </button>
  );
}

// =============================================================================
// TAB BAR
// =============================================================================

export function TabBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-6 border-b border-[#e5e7eb] dark:border-[#27272a]">
      {children}
    </div>
  );
}

// =============================================================================
// STAT CARD
// =============================================================================

interface StatCardProps {
  label: string;
  value: string;
  trend?: string;
  color?: "green" | "red" | "indigo";
}

export function StatCard({ label, value, trend, color = "green" }: StatCardProps) {
  const colorClasses = {
    green: "text-[#059669] dark:text-[#10b981]",
    red: "text-[#dc2626] dark:text-[#ef4444]",
    indigo: "text-[#4f46e5] dark:text-[#6366f1]",
  };

  return (
    <Card className="flex flex-col gap-2">
      <p className="text-sm text-[#6b7280] dark:text-[#a1a1aa]">{label}</p>
      <p className="text-2xl font-semibold text-[#111827] dark:text-[#f9fafb]">
        {value}
      </p>
      {trend && <p className={`text-sm ${colorClasses[color]}`}>{trend}</p>}
    </Card>
  );
}

// =============================================================================
// LINE CHART (SVG - Data-driven, no external deps)
// =============================================================================

interface LineChartProps {
  /** Array of data series, each with name and values */
  series: {
    name: string;
    data: number[];
    color: "green" | "red" | "indigo" | "teal";
  }[];
  /** Chart height in pixels */
  height?: number;
  /** Footer text */
  footer?: string;
  /** Show tooltip on last point */
  showTooltip?: boolean;
}

export function LineChart({
  series,
  height = 260,
  footer,
  showTooltip = true,
}: LineChartProps) {
  const width = 900;
  const padding = 40;

  // Calculate max value across all series for scaling
  const allValues = series.flatMap((s) => s.data);
  const maxValue = Math.max(...allValues) * 1.1; // 10% headroom

  const scaleX = (i: number, length: number) =>
    padding + (i * (width - padding * 2)) / (length - 1);

  const scaleY = (v: number) =>
    height - padding - (v / maxValue) * (height - padding * 2);

  const path = (arr: number[]) =>
    arr
      .map((v, i) => `${i === 0 ? "M" : "L"} ${scaleX(i, arr.length)} ${scaleY(v)}`)
      .join(" ");

  return (
    <Card>
      <div className="w-full overflow-hidden">
        <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map((g) => (
            <line
              key={g}
              x1={padding}
              x2={width - padding}
              y1={(g * (height - padding * 2)) / 4 + padding}
              y2={(g * (height - padding * 2)) / 4 + padding}
              className="stroke-[#e5e7eb] dark:stroke-[#27272a]"
              strokeWidth="1"
            />
          ))}

          {/* Data lines */}
          {series.map((s) => (
            <path
              key={s.name}
              d={path(s.data)}
              fill="none"
              className={`
                ${s.color === "green" ? "stroke-[#059669] dark:stroke-[#10b981]" : ""}
                ${s.color === "red" ? "stroke-[#dc2626] dark:stroke-[#ef4444]" : ""}
                ${s.color === "indigo" ? "stroke-[#4f46e5] dark:stroke-[#6366f1]" : ""}
                ${s.color === "teal" ? "stroke-[#0d9488] dark:stroke-[#14b8a6]" : ""}
              `}
              strokeWidth="3"
            />
          ))}

          {/* Tooltip on last point of first series */}
          {showTooltip && series.length > 0 && series[0].data.length > 0 && (
            <g
              transform={`translate(${scaleX(series[0].data.length - 1, series[0].data.length)}, ${scaleY(series[0].data[series[0].data.length - 1])})`}
            >
              <circle
                r="5"
                className={`
                  ${series[0].color === "green" ? "fill-[#059669] dark:fill-[#10b981]" : ""}
                  ${series[0].color === "red" ? "fill-[#dc2626] dark:fill-[#ef4444]" : ""}
                  ${series[0].color === "indigo" ? "fill-[#4f46e5] dark:fill-[#6366f1]" : ""}
                  ${series[0].color === "teal" ? "fill-[#0d9488] dark:fill-[#14b8a6]" : ""}
                `}
              />
              <rect
                x="-60"
                y="-42"
                width="120"
                height="28"
                rx="6"
                className="fill-white dark:fill-[#18181b] stroke-[#e5e7eb] dark:stroke-[#27272a]"
              />
              <text
                x="0"
                y="-23"
                textAnchor="middle"
                fontSize="11"
                className="fill-[#111827] dark:fill-[#f9fafb]"
              >
                {series[0].name}: ${series[0].data[series[0].data.length - 1].toLocaleString()}
              </text>
            </g>
          )}
        </svg>
      </div>

      {footer && (
        <p className="mt-3 text-xs text-[#6b7280] dark:text-[#a1a1aa]">
          {footer}
        </p>
      )}
    </Card>
  );
}

// =============================================================================
// DATA TABLE
// =============================================================================

interface TableColumn {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  format?: (value: unknown, row: Record<string, unknown>) => ReactNode;
}

interface DataTableProps {
  columns: TableColumn[];
  data: Record<string, unknown>[];
  className?: string;
}

export function DataTable({ columns, data, className = "" }: DataTableProps) {
  return (
    <Card noPadding className={`overflow-hidden ${className}`}>
      <table className="w-full text-sm">
        <thead className="bg-[#f9fafb] dark:bg-[#27272a] text-[#6b7280] dark:text-[#a1a1aa]">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`
                  px-4 py-3 font-medium
                  ${col.align === "right" ? "text-right" : ""}
                  ${col.align === "center" ? "text-center" : ""}
                  ${!col.align || col.align === "left" ? "text-left" : ""}
                `}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              className={`
                ${i % 2 ? "bg-[#f9fafb] dark:bg-[#1f1f23]" : "bg-white dark:bg-[#18181b]"}
                hover:bg-[#f3f4f6] dark:hover:bg-[#27272a]
                transition-colors
              `}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`
                    px-4 py-3 text-[#111827] dark:text-[#f9fafb]
                    ${col.align === "right" ? "text-right" : ""}
                    ${col.align === "center" ? "text-center" : ""}
                  `}
                >
                  {col.format
                    ? col.format(row[col.key], row)
                    : String(row[col.key] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

// =============================================================================
// BUTTONS
// =============================================================================

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function Button({
  children,
  variant = "outline",
  size = "md",
  onClick,
  disabled,
  className = "",
}: ButtonProps) {
  const baseClasses = "rounded-md font-medium transition-colors inline-flex items-center justify-center";

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const variantClasses = {
    primary: `
      bg-[#4f46e5] dark:bg-[#6366f1]
      text-white
      hover:bg-[#4338ca] dark:hover:bg-[#4f46e5]
      disabled:opacity-50
    `,
    secondary: `
      bg-[#f3f4f6] dark:bg-[#27272a]
      text-[#111827] dark:text-[#f9fafb]
      hover:bg-[#e5e7eb] dark:hover:bg-[#3f3f46]
      disabled:opacity-50
    `,
    outline: `
      border border-[#e5e7eb] dark:border-[#27272a]
      bg-white dark:bg-[#18181b]
      text-[#111827] dark:text-[#f9fafb]
      hover:bg-[#f9fafb] dark:hover:bg-[#27272a]
      disabled:opacity-50
    `,
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

// =============================================================================
// PAGE HEADER
// =============================================================================

export function PageHeader({
  title,
  actions,
}: {
  title: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-semibold text-[#111827] dark:text-[#f9fafb]">
        {title}
      </h1>
      {actions && <div className="flex gap-3">{actions}</div>}
    </div>
  );
}

// =============================================================================
// TEXT UTILITIES
// =============================================================================

export function Text({
  children,
  muted = false,
  size = "base",
  className = "",
}: {
  children: ReactNode;
  muted?: boolean;
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl";
  className?: string;
}) {
  const textColor = muted
    ? "text-[#6b7280] dark:text-[#a1a1aa]"
    : "text-[#111827] dark:text-[#f9fafb]";

  const textSize = {
    xs: "text-xs",
    sm: "text-sm",
    base: "text-base",
    lg: "text-lg",
    xl: "text-xl",
    "2xl": "text-2xl",
  };

  return (
    <span className={`${textColor} ${textSize[size]} ${className}`}>
      {children}
    </span>
  );
}

// =============================================================================
// CURRENCY FORMATTER
// =============================================================================

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// =============================================================================
// CHANGE INDICATOR
// =============================================================================

export function ChangeIndicator({ value }: { value: string | number }) {
  const strValue = String(value);
  const isNegative = strValue.includes("-");

  return (
    <span
      className={
        isNegative
          ? "text-[#dc2626] dark:text-[#ef4444]"
          : "text-[#059669] dark:text-[#10b981]"
      }
    >
      {strValue}
    </span>
  );
}
