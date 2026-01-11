"use client";

import { usePathname } from "next/navigation";
import { HeroBackground } from "@/components/layout/HeroBackground";

/**
 * Applies ReconAI hero background to dashboard routes only.
 * Auth pages, marketing pages, and homepage handle their own backgrounds.
 */
export function RouteBackgroundWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "/";

  // Routes that handle their own background
  const skipHeroBackground =
    pathname === "/" ||
    pathname.startsWith("/sign-in") ||
    pathname.startsWith("/sign-up") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/platform") ||
    pathname.startsWith("/how-it-works") ||
    pathname.startsWith("/packages") ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/support") ||
    pathname.startsWith("/security") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/terms") ||
    pathname.startsWith("/legal") ||
    pathname.startsWith("/maintenance");

  if (skipHeroBackground) return <>{children}</>;

  return <HeroBackground>{children}</HeroBackground>;
}
