/**
 * Render Guard Utilities
 *
 * CANONICAL LAWS COMPLIANCE:
 * - renderIfAvailable: Only render component if data exists and is valid
 * - renderIfNonEmpty: Only render component if array has items
 * - formatMetric: null → "—", number → formatted, never coerce to 0
 *
 * These guards ensure fail-closed behavior: unknown/missing data is explicit, not hidden.
 */

import type { ReactNode } from "react";

/**
 * Renders component only if data is available (not null/undefined).
 * Returns null (renders nothing) if data is missing.
 *
 * @param data - The data to check for availability
 * @param renderFn - Function that receives the data and returns a ReactNode
 * @returns ReactNode or null
 *
 * @example
 * renderIfAvailable(metrics?.counts, (counts) => <CountsPanel counts={counts} />)
 */
export function renderIfAvailable<T>(
  data: T | null | undefined,
  renderFn: (data: T) => ReactNode,
): ReactNode {
  if (data == null) {
    return null;
  }
  return renderFn(data);
}

/**
 * Renders component only if array exists and has at least one item.
 * Returns null (renders nothing) if array is empty or missing.
 *
 * @param array - The array to check
 * @param renderFn - Function that receives the non-empty array and returns a ReactNode
 * @returns ReactNode or null
 *
 * @example
 * renderIfNonEmpty(documents, (docs) => <DocumentList documents={docs} />)
 */
export function renderIfNonEmpty<T>(
  array: T[] | null | undefined,
  renderFn: (array: T[]) => ReactNode,
): ReactNode {
  if (!array || array.length === 0) {
    return null;
  }
  return renderFn(array);
}

/**
 * Formats a metric value for display.
 * - null/undefined → "—" (em dash)
 * - number → formatted with locale
 * - string → passed through
 *
 * NEVER coerces null to 0. Unknown state is explicit.
 *
 * @param value - The value to format
 * @param options - Optional formatting options
 * @returns Formatted string
 *
 * @example
 * formatMetric(null) // "—"
 * formatMetric(1234.56) // "1,234.56"
 * formatMetric(1234.56, { style: 'currency', currency: 'USD' }) // "$1,234.56"
 */
export function formatMetric(
  value: number | string | null | undefined,
  options?: Intl.NumberFormatOptions,
): string {
  if (value == null) {
    return "—";
  }

  if (typeof value === "string") {
    return value;
  }

  return new Intl.NumberFormat("en-US", options).format(value);
}

/**
 * Formats a currency value for display.
 * Shorthand for formatMetric with currency options.
 *
 * @param value - The value to format
 * @param currency - Currency code (default: USD)
 * @returns Formatted currency string or "—" for null
 *
 * @example
 * formatCurrency(1234.56) // "$1,234.56"
 * formatCurrency(null) // "—"
 */
export function formatCurrency(
  value: number | null | undefined,
  currency: string = "USD",
): string {
  return formatMetric(value, { style: "currency", currency });
}

/**
 * Formats a percentage value for display.
 *
 * @param value - The value to format (0-100 or 0-1 based on isDecimal)
 * @param isDecimal - If true, value is 0-1 and will be multiplied by 100
 * @returns Formatted percentage string or "—" for null
 *
 * @example
 * formatPercent(85.5) // "85.5%"
 * formatPercent(0.855, true) // "85.5%"
 * formatPercent(null) // "—"
 */
export function formatPercent(
  value: number | null | undefined,
  isDecimal: boolean = false,
): string {
  if (value == null) {
    return "—";
  }

  const displayValue = isDecimal ? value * 100 : value;
  return `${formatMetric(displayValue, { maximumFractionDigits: 1 })}%`;
}

/**
 * Formats a count value for display.
 * Uses compact notation for large numbers.
 *
 * @param value - The count to format
 * @param compact - If true, use compact notation (1.2K, 3.4M)
 * @returns Formatted count string or "—" for null
 *
 * @example
 * formatCount(1234) // "1,234"
 * formatCount(1234, true) // "1.2K"
 * formatCount(null) // "—"
 */
export function formatCount(
  value: number | null | undefined,
  compact: boolean = false,
): string {
  if (value == null) {
    return "—";
  }

  if (compact && Math.abs(value) >= 1000) {
    return formatMetric(value, {
      notation: "compact",
      maximumFractionDigits: 1,
    });
  }

  return formatMetric(value, { maximumFractionDigits: 0 });
}

/**
 * Checks if any of the provided values are available (not null/undefined).
 * Useful for determining if a section should render.
 *
 * @param values - Values to check
 * @returns true if at least one value is available
 *
 * @example
 * hasAnyData(metrics?.counts, metrics?.summary) // true if either exists
 */
export function hasAnyData(...values: unknown[]): boolean {
  return values.some((v) => v != null);
}

/**
 * Checks if all provided values are available (not null/undefined).
 * Useful for determining if a component has all required data.
 *
 * @param values - Values to check
 * @returns true if all values are available
 *
 * @example
 * hasAllData(metrics?.counts, metrics?.summary) // true only if both exist
 */
export function hasAllData(...values: unknown[]): boolean {
  return values.every((v) => v != null);
}
