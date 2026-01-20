"use client";

import { useState, useCallback } from "react";
import { Search, Download, Command } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilterConfig {
  id: string;
  label: string;
  options: { value: string; label: string }[];
}

interface ExportAction {
  label: string;
  onClick: () => void;
}

interface UtilityStripProps {
  /** Placeholder text for local search input */
  searchPlaceholder?: string;
  /** Callback for local search (shows search input) */
  onSearch?: (query: string) => void;
  /** Show command palette trigger button */
  showCommandTrigger?: boolean;
  /** Callback when command palette trigger is clicked */
  onCommandTriggerClick?: () => void;
  /** Filters configuration */
  filters?: FilterConfig[];
  /** Callback when filter values change */
  onFilterChange?: (filters: Record<string, string>) => void;
  /** Export action buttons */
  exportActions?: ExportAction[];
  /** Additional className */
  className?: string;
}

/**
 * UtilityStrip — Canonical host for search, filters, and command palette entry.
 * Placed below page header, above content panels.
 * Dense styling for operational modes.
 *
 * Features:
 * - Command palette trigger with hotkey hint (⌘K / Ctrl+K)
 * - Local search input (optional)
 * - Filter dropdowns
 * - Export action buttons
 * - Consistent focus rings and accessibility
 */
export function UtilityStrip({
  searchPlaceholder = "Search...",
  onSearch,
  showCommandTrigger = false,
  onCommandTriggerClick,
  filters = [],
  onFilterChange,
  exportActions = [],
  className,
}: UtilityStripProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      onSearch?.(value);
    },
    [onSearch],
  );

  const handleFilterChange = useCallback(
    (filterId: string, value: string) => {
      const newFilters = { ...filterValues, [filterId]: value };
      setFilterValues(newFilters);
      onFilterChange?.(newFilters);
    },
    [filterValues, onFilterChange],
  );

  // Detect OS for hotkey hint
  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPod|iPhone|iPad/.test(navigator.userAgent);
  const hotkeyHint = isMac ? "⌘K" : "Ctrl+K";

  return (
    <div
      className={[
        "flex flex-wrap items-center gap-3",
        "rounded-[var(--elevation-radius-lg)] border border-border/60",
        "bg-muted/20 backdrop-blur-sm",
        "px-3 py-2 shadow-sm",
        "transition-shadow duration-[var(--motion-standard)] ease-[var(--motion-ease)]",
        "hover:shadow-md",
        className ?? "",
      ]
        .join(" ")
        .trim()}
      role="toolbar"
      aria-label="Page utility controls"
    >
      {/* Command Palette Trigger */}
      {showCommandTrigger && onCommandTriggerClick && (
        <button
          type="button"
          onClick={onCommandTriggerClick}
          className={[
            "inline-flex h-9 items-center gap-2 rounded-md",
            "border border-border bg-background/70 px-3",
            "text-sm text-muted-foreground",
            "hover:bg-muted/50 hover:text-foreground",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "transition-colors",
          ].join(" ")}
          aria-label={`Open command palette (${hotkeyHint})`}
          aria-haspopup="dialog"
        >
          <Command className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Command</span>
          <kbd
            className={[
              "ml-1 hidden sm:inline-flex h-5 items-center rounded",
              "border border-border/60 bg-muted/50 px-1.5",
              "font-mono text-[10px] text-muted-foreground",
            ].join(" ")}
          >
            {hotkeyHint}
          </kbd>
        </button>
      )}

      {/* Local Search Input */}
      {onSearch && (
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className={[
              "h-9 w-full rounded-md border border-border bg-background/70",
              "pl-9 pr-3 text-sm placeholder:text-muted-foreground",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            ].join(" ")}
            aria-label={searchPlaceholder}
          />
        </div>
      )}

      {/* Filters */}
      {filters.map((filter) => (
        <div key={filter.id} className="flex items-center gap-2">
          <label
            htmlFor={`filter-${filter.id}`}
            className="text-xs font-medium text-muted-foreground"
          >
            {filter.label}
          </label>
          <select
            id={`filter-${filter.id}`}
            value={filterValues[filter.id] ?? ""}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
            className={[
              "h-9 rounded-md border border-border bg-background/70 px-3 text-sm",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            ].join(" ")}
          >
            <option value="">All</option>
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ))}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Export Actions */}
      {exportActions.map((action, idx) => (
        <Button
          key={idx}
          variant="secondary"
          size="sm"
          onClick={action.onClick}
        >
          <Download className="mr-2 h-4 w-4" aria-hidden="true" />
          {action.label}
        </Button>
      ))}
    </div>
  );
}
