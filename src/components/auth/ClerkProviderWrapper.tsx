"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { OrgProvider } from "@/lib/org-context";
import { UserProfileProvider } from "@/lib/user-profile-context";

export function ClerkProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider afterSignOutUrl="/">
      <OrgProvider>
        <UserProfileProvider>{children}</UserProfileProvider>
      </OrgProvider>
    </ClerkProvider>
  );
}
