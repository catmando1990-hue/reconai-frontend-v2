"use client";

import { usePathname } from "next/navigation";
import { HeroBackground } from "@/components/layout/HeroBackground";

/**
 * Keeps homepage (/) unchanged while applying ReconAI hero background everywhere else.
 */
export function RouteBackgroundWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "/";

  // Do NOT touch the landing page background.
  if (pathname === "/") return <>{children}</>;

  return <HeroBackground>{children}</HeroBackground>;
}
