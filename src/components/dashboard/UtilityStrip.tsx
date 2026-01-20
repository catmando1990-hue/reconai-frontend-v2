"use client";

import { useState } from "react";
import { Search, Download } from "lucide-react";
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
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
  filters?: FilterConfig[];
  onFilterChange?: (filters: Record<string, string>) => void;
  exportActions?: ExportAction[];
  className?: string;
}

/**
 * UtilityStrip — Horizontal strip for filters, search, and export controls.
 * Placed below page header, above content panels.
 * Dense styling for operational modes.
 */
export function UtilityStrip({
  searchPlaceholder = "Search...",
  onSearch,
  filters = [],
  onFilterChange,
  exportActions = [],
  className,
}: UtilityStripProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch?.(value);
  };

  const handleFilterChange = (filterId: string, value: string) => {
    const newFilters = { ...filterValues, [filterId]: value };
    setFilterValues(newFilters);
    onFilterChange?.(newFilters);
  };

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
    >
      {/* Search */}
      {onSearch && (
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-9 w-full rounded-md border border-border bg-background/70 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
            className="h-9 rounded-md border border-border bg-background/70 px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
          <Download className="mr-2 h-4 w-4" />
          {action.label}
        </Button>
      ))}
    </div>
  );
}
