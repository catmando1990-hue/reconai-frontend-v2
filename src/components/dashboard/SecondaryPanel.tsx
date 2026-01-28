"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface SecondaryPanelProps {
  title: string;
  children: ReactNode;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
}

/**
 * SecondaryPanel — Supporting information panels.
 * Takes ~30-40% of viewport on desktop (lg:col-span-4 in 12-col grid).
 * Enterprise density: compact padding, tight spacing.
 * Optionally collapsible for dense operational modes.
 *
 * BACKGROUND NORMALIZATION:
 * - Uses bg-card (supporting sections)
 * - Borders over shadows
 * - No decorative colors
 */
export function SecondaryPanel({
  title,
  children,
  collapsible = false,
  defaultCollapsed = false,
  className,
}: SecondaryPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  return (
    <div
      className={["rounded-lg border border-border bg-card", className ?? ""]
        .join(" ")
        .trim()}
    >
      <div className="dash-accent-divider" />
      <div
        className={[
          "flex items-center justify-between px-3 py-2.5",
          collapsible
            ? "cursor-pointer select-none hover:bg-muted/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            : "",
        ].join(" ")}
        onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
        onKeyDown={
          collapsible
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setIsCollapsed(!isCollapsed);
                }
              }
            : undefined
        }
        role={collapsible ? "button" : undefined}
        tabIndex={collapsible ? 0 : undefined}
        aria-expanded={collapsible ? !isCollapsed : undefined}
      >
        <h3 className="text-(length:--dash-body-size) font-medium text-foreground">
          {title}
        </h3>
        {collapsible && (
          <ChevronDown
            className={[
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              isCollapsed ? "-rotate-90" : "",
            ].join(" ")}
          />
        )}
      </div>
      {!isCollapsed && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}
