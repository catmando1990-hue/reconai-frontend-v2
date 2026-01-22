"use client";

import useSWR from "swr";
import { Clock, AlertTriangle, User } from "lucide-react";
import { auditedFetch } from "@/lib/auditedFetch";

interface MaintenanceStatusData {
  ok: boolean;
  enabled: boolean;
  reason: string | null;
  updated_at: string | null;
  updated_by: string | null;
}

/**
 * BUILD 10: Extended maintenance status display.
 * Shows reason, timestamp, and updated_by when maintenance is ON.
 * Renders nothing when maintenance is OFF.
 * No auth required - uses public endpoint.
 */
export default function MaintenanceStatus() {
  // Manual-first UX: No polling. Maintenance status fetched once on mount.
  const { data, error } = useSWR<MaintenanceStatusData>(
    `${process.env.NEXT_PUBLIC_API_URL}/api/maintenance/status`,
    async (url: string) => {
      return auditedFetch<MaintenanceStatusData>(url);
    },
    {
      revalidateOnFocus: false,
    },
  );

  // Don't render if maintenance is OFF or on error
  if (error || !data?.enabled) return null;

  const formatTimestamp = (ts: string | null): string => {
    if (!ts) return "Unknown";
    try {
      const date = new Date(ts);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return ts;
    }
  };

  return (
    <div className="mt-8 max-w-md rounded-xl border border-amber-500/30 bg-amber-500/5 p-6">
      <div className="mb-4 flex items-center gap-2 text-amber-400">
        <AlertTriangle className="h-5 w-5" />
        <span className="font-medium">Maintenance in Progress</span>
      </div>

      <div className="space-y-3 text-sm">
        {data.reason && (
          <div className="text-muted-foreground">
            <span className="font-medium text-foreground">Reason:</span>{" "}
            {data.reason}
          </div>
        )}

        {data.updated_at && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Started: {formatTimestamp(data.updated_at)}</span>
          </div>
        )}

        {data.updated_by && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4" />
            <span>By: {data.updated_by}</span>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        We apologize for the inconvenience. Please check back shortly.
      </p>
    </div>
  );
}
