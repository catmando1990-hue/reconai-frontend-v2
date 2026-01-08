"use client";

import { useState } from "react";
import Sidebar from "@/components/dashboard/Sidebar";

/**
 * Phase 17:
 * - Makes dashboard shell theme-safe (no hardcoded light background)
 * - Uses new 3-tier Sidebar with collapse functionality
 */
export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className="min-w-0 flex-1 bg-background">
        <div className="h-full w-full">{children}</div>
      </main>
    </div>
  );
}
