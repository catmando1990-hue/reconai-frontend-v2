"use client";

import Link from "next/link";
import {
  ClipboardCheck,
  FileText,
  Download,
  Shield,
  ChevronRight,
  Clock,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * OperationsSurface - Operations & Compliance action queues
 *
 * CANONICAL LAWS:
 * - List-first layout (no card spam)
 * - No placeholders - intentional empty states only
 * - Token-only colors
 * - GovCon compliance deadlines are entitlement-gated
 */

interface ActionItem {
  id: string;
  title: string;
  description?: string;
  href: string;
  count?: number;
  urgent?: boolean;
  dueDate?: string;
}

interface OperationsSurfaceProps {
  reconciliations: ActionItem[];
  acknowledgements: ActionItem[];
  exports: ActionItem[];
  complianceDeadlines?: ActionItem[]; // GovCon-only
  hasGovCon?: boolean;
  loading?: boolean;
  className?: string;
}

// Action queue section
function ActionQueue({
  title,
  icon,
  items,
  emptyMessage,
  loading,
}: {
  title: string;
  icon: React.ReactNode;
  items: ActionItem[];
  emptyMessage: string;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
        <div className="h-10 bg-muted rounded animate-pulse" />
        <div className="h-10 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <span className="text-sm font-medium text-foreground">{title}</span>
        {items.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">
            {items.length}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">{emptyMessage}</p>
      ) : (
        <ul className="space-y-1">
          {items.slice(0, 3).map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center justify-between p-2 rounded-lg",
                  "hover:bg-muted/50 transition-colors group",
                  item.urgent && "border-l-2 border-destructive pl-3",
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {item.urgent && (
                    <AlertCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
                  )}
                  <span className="text-sm text-foreground truncate">
                    {item.title}
                  </span>
                  {item.count !== undefined && item.count > 1 && (
                    <span className="text-xs text-muted-foreground">
                      ({item.count})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.dueDate && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(item.dueDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </Link>
            </li>
          ))}
          {items.length > 3 && (
            <li>
              <Link
                href={items[0].href.split("?")[0]}
                className="text-xs text-primary hover:text-primary/80 transition-colors py-1 block"
              >
                View all {items.length} items
              </Link>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

export function OperationsSurface({
  reconciliations,
  acknowledgements,
  exports,
  complianceDeadlines = [],
  hasGovCon = false,
  loading = false,
  className,
}: OperationsSurfaceProps) {
  // Check if any queue has items
  const hasAnyItems =
    reconciliations.length > 0 ||
    acknowledgements.length > 0 ||
    exports.length > 0 ||
    (hasGovCon && complianceDeadlines.length > 0);

  return (
    <section
      aria-label="Operations & Compliance"
      className={cn(
        "rounded-2xl border border-border bg-card",
        "shadow-sm p-6",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Operations</h2>
          <p className="text-sm text-muted-foreground">
            {hasAnyItems ? "Action items requiring attention" : "All caught up"}
          </p>
        </div>
      </div>

      {/* Action Queues Grid */}
      <div
        className={cn(
          "grid gap-6",
          hasGovCon ? "md:grid-cols-4" : "md:grid-cols-3",
        )}
      >
        {/* Pending Reconciliations */}
        <ActionQueue
          title="Reconciliations"
          icon={<ClipboardCheck className="h-4 w-4 text-muted-foreground" />}
          items={reconciliations}
          emptyMessage="No pending reconciliations"
          loading={loading}
        />

        {/* Policy Acknowledgements */}
        <ActionQueue
          title="Acknowledgements"
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
          items={acknowledgements}
          emptyMessage="No pending acknowledgements"
          loading={loading}
        />

        {/* Export Tasks */}
        <ActionQueue
          title="Exports"
          icon={<Download className="h-4 w-4 text-muted-foreground" />}
          items={exports}
          emptyMessage="No pending exports"
          loading={loading}
        />

        {/* Compliance Deadlines - GovCon only */}
        {hasGovCon && (
          <ActionQueue
            title="Compliance"
            icon={<Shield className="h-4 w-4 text-muted-foreground" />}
            items={complianceDeadlines}
            emptyMessage="No upcoming deadlines"
            loading={loading}
          />
        )}
      </div>

      {/* No items state */}
      {!loading && !hasAnyItems && (
        <div className="mt-4 p-4 rounded-xl bg-muted/30 text-center">
          <p className="text-sm text-muted-foreground">
            No action items at this time. Your operations are running smoothly.
          </p>
        </div>
      )}
    </section>
  );
}

export type { ActionItem, OperationsSurfaceProps };
