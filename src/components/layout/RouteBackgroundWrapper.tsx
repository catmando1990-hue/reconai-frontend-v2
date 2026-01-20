"use client";

import { usePathname } from "next/navigation";
import HeroBackdrop from "@/components/layout/HeroBackdrop";

/**
 * RouteBackgroundWrapper
 *
 * Applies variant-based hero backdrop based on route context.
 *
 * Rules:
 * - Auth routes: NO hero (handled by auth layout)
 * - Marketing routes: handled by their own page components
 * - Dashboard/product routes: product-lite variant
 */
export function RouteBackgroundWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() || "/";

  // Auth routes - no hero backdrop (auth layout owns background)
  const isAuthRoute =
    pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up");

  // Marketing routes - pages handle their own hero via HeroBackdrop directly
  const isMarketingRoute =
    pathname === "/" ||
    pathname.startsWith("/about") ||
    pathname.startsWith("/support") ||
    pathname.startsWith("/platform") ||
    pathname.startsWith("/how-it-works") ||
    pathname.startsWith("/packages") ||
    pathname.startsWith("/security") ||
    pathname.startsWith("/privacy") ||
    pathname.startsWith("/terms") ||
    pathname.startsWith("/legal") ||
    pathname.startsWith("/pricing");

  // Static/utility pages - no hero
  const isUtilityRoute =
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/maintenance");

  // Skip hero for auth, marketing (they handle own), and utility routes
  if (isAuthRoute || isMarketingRoute || isUtilityRoute) {
    return <>{children}</>;
  }

  // Product/dashboard routes get product-lite variant
  return <HeroBackdrop variant="product-lite">{children}</HeroBackdrop>;
}
