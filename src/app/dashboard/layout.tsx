import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ClerkProviderWrapper } from "@/components/auth/ClerkProviderWrapper";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

/**
 * Canonical /dashboard layout
 *
 * Note: /dashboard is not within the (dashboard) route group.
 * This layout ensures all /dashboard/* routes inherit the same authenticated shell.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=/dashboard");
  }

  return (
    <ClerkProviderWrapper>
      <DashboardShell>{children}</DashboardShell>
    </ClerkProviderWrapper>
  );
}
