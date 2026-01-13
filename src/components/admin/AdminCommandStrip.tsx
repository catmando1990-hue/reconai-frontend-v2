"use client";

import { useUser } from "@clerk/nextjs";
import MaintenanceToggle from "./MaintenanceToggle";
import { Shield } from "lucide-react";

/**
 * BUILD 9: Admin-only command strip.
 * Google-style minimal admin controls bar.
 * Only visible to users with admin role.
 * No Clerk UI components - uses useUser hook for role check.
 */
export function AdminCommandStrip() {
  const { user, isLoaded } = useUser();

  // Don't render until user is loaded
  if (!isLoaded) return null;

  // Check for admin role in public metadata
  const publicMetadata = user?.publicMetadata as
    | Record<string, unknown>
    | undefined;
  const role = publicMetadata?.role as string | undefined;
  const isAdmin = role === "admin" || role === "org:admin";

  // Non-admin users never see this
  if (!isAdmin) return null;

  return (
    <div className="border-b border-amber-500/20 bg-amber-500/5">
      <div className="mx-auto flex h-8 max-w-7xl items-center justify-between px-4 text-xs">
        <div className="flex items-center gap-2 text-amber-400">
          <Shield className="h-3 w-3" />
          <span className="font-medium">Admin</span>
        </div>

        <div className="flex items-center gap-3">
          <MaintenanceToggle />
        </div>
      </div>
    </div>
  );
}
