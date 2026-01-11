"use client";

import { OrganizationProfile } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

export default function OrganizationProfilePage() {
  const { resolvedTheme } = useTheme();
  const appearance = resolvedTheme === "dark" ? { baseTheme: dark } : {};

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center p-4">
      <OrganizationProfile
        appearance={appearance}
        afterLeaveOrganizationUrl="/"
      />
    </div>
  );
}
