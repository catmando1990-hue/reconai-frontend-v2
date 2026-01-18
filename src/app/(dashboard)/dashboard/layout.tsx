import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ClerkProviderWrapper } from "@/components/auth/ClerkProviderWrapper";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

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
