"use client";

import type { ReactNode } from "react";
import { ResponsiveContainer } from "recharts";

type Props = {
  /** Provide a fixed height class (recommended) like "h-64" or set style height on the parent. */
  className?: string;
  /** Minimum height in pixels to prevent width/height = -1 warnings. Default: 240 */
  minHeightPx?: number;
  children: ReactNode;
};

/**
 * SafeResponsiveContainer
 * Recharts can warn when parent has unresolved size (width/height -1).
 * This wrapper enforces a minimum render box and min-w-0.
 *
 * Canonical: no polling, no timers, no background loops.
 */
export default function SafeResponsiveContainer({
  className,
  minHeightPx = 240,
  children,
}: Props) {
  return (
    <div
      className={["w-full min-w-0", className].filter(Boolean).join(" ")}
      style={{ minHeight: minHeightPx }}
    >
      <ResponsiveContainer width="100%" height="100%">
        {children as any}
      </ResponsiveContainer>
    </div>
  );
}
