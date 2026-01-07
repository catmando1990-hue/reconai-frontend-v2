import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/DashboardShell";

/**
 * Protect ALL dashboard routes + wrap them in the dashboard shell.
 *
 * This prevents each page from needing its own auth() redirect check.
 */
export default async function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=/dashboard");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
