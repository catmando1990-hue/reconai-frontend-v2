import type { ReactNode } from "react";
import { MarketingShell } from "@/components/marketing";

/**
 * MarketingLayout — Canonical layout for ALL public/marketing pages.
 *
 * Uses MarketingShell which provides:
 * - ReconUtilityHeader (brand + nav + Resources dropdown)
 * - Consistent background (orbs, gradients)
 * - Light/dark theme parity
 *
 * RULE: All public pages MUST be under this route group.
 * No public page may render without this layout.
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <MarketingShell>{children}</MarketingShell>;
}
