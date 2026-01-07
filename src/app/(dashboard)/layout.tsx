import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SidebarRail } from "@/components/dashboard/SidebarRail";
import { SidebarContext } from "@/components/dashboard/SidebarContext";

/**
 * Phase 18: True 3-tier sidebar
 * - Tier 1: Icon rail (global, always visible)
 * - Tier 2: Context sidebar (changes by product section)
 * - Tier 3: Main content
 */
export default async function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=/dashboard");
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <SidebarRail />
      <SidebarContext />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
