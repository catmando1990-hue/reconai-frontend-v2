"use client";

import { ReactNode } from "react";
import clsx from "clsx";

type HeroVariant = "marketing" | "auth" | "product-lite";

interface Props {
  variant: HeroVariant;
  children: ReactNode;
}

/**
 * HeroBackdrop - Single authoritative hero component.
 *
 * Variants:
 * - marketing: Full hero with gradient overlays and decorative layers
 * - auth: Clean background-only, no decorative elements
 * - product-lite: Minimal background for dashboard/product pages
 *
 * Rules:
 * - Marketing pages must explicitly opt in
 * - Auth pages must explicitly opt out (use no HeroBackdrop)
 * - No global hero styles - all visuals are component-scoped
 */
export default function HeroBackdrop({ variant, children }: Props) {
  return (
    <section
      className={clsx(
        "relative isolate w-full",
        variant === "marketing" && "min-h-[90vh]",
        variant === "auth" && "min-h-screen bg-background",
        variant === "product-lite" && "bg-background",
      )}
    >
      {variant === "marketing" && (
        <div className="absolute inset-0 -z-10 pointer-events-none">
          {/* Gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/60 to-background" />
          {/* Subtle decorative layer */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          </div>
        </div>
      )}

      <div className="relative z-10">{children}</div>
    </section>
  );
}
