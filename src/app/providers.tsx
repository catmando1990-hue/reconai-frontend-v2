"use client";

import React from "react";

import { OrgProvider } from "@/lib/org-context";
import { UserProfileProvider } from "@/lib/user-profile-context";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <OrgProvider>
      <UserProfileProvider>{children}</UserProfileProvider>
    </OrgProvider>
  );
}
