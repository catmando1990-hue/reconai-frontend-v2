"use client";

import { useUser } from "@clerk/nextjs";
import MaintenanceToggle from "./MaintenanceToggle";
import { Shield } from "lucide-react";
import { StatusChip } from "@/components/dashboard/StatusChip";

/**
 * BUILD 9/18: Admin-only command strip.
 * Google-style minimal admin controls bar.
 * Only visible to users with admin role.
 * No Clerk UI components - uses useUser hook for role check.
 * BUILD 18: Remove hardcoded colors; use semantic tokens.
 */
export function AdminCommandStrip() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return null;

  const publicMetadata = user?.publicMetadata as
    | Record<string, unknown>
    | undefined;
  const role = publicMetadata?.role as string | undefined;
  const isAdmin = role === "admin" || role === "org:admin";

  if (!isAdmin) return null;

  return (
    <div className="border-b border-border bg-background/60 backdrop-blur">
      <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Shield className="h-3 w-3" />
          <span className="font-medium text-foreground">Admin</span>
          <StatusChip variant="muted">Controls</StatusChip>
        </div>

        <div className="flex items-center gap-3">
          <MaintenanceToggle />
        </div>
      </div>
    </div>
  );
}
