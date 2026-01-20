"use client";

import HeroBackdrop from "@/components/layout/HeroBackdrop";

/**
 * @deprecated Use HeroBackdrop directly with variant prop instead.
 *
 * This component is kept for backwards compatibility only.
 * Prefer: <HeroBackdrop variant="marketing|auth|product-lite">
 */
export function HeroBackground({ children }: { children: React.ReactNode }) {
  // Legacy usage maps to product-lite variant for dashboard routes
  return <HeroBackdrop variant="product-lite">{children}</HeroBackdrop>;
}
