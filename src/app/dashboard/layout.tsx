import React from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ClerkProviderWrapper } from "@/components/auth/ClerkProviderWrapper";

export default async function DashboardRootLayout({
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
