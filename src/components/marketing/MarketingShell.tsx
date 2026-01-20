"use client";

import * as React from "react";
import ReconUtilityHeader from "@/components/layout/ReconUtilityHeader";

/**
 * MarketingShell — Shared background wrapper for public marketing pages.
 *
 * Provides the same visual treatment as the Home page:
 * - Gradient overlays for light/dark mode readability
 * - Animated blur orbs
 * - No images (lightweight)
 * - No polling/timers
 * - Dashboard-only: false (this is for public pages)
 */
export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen text-foreground overflow-hidden">
      {/* Public header with brand link */}
      <div className="relative z-20">
        <ReconUtilityHeader />
      </div>
      {/* Base background layer - z-0 */}
      <div className="absolute inset-0 z-0 bg-background" />

      {/* Animated blur orbs - z-[1] above base, below gradient */}
      <div className="absolute -top-40 right-[-10%] z-[1] h-96 w-96 rounded-full bg-primary/10 blur-3xl motion-safe:animate-pulse" />
      <div className="absolute -bottom-40 left-[-10%] z-[1] h-96 w-96 rounded-full bg-primary/10 blur-3xl motion-safe:animate-pulse" />
      <div className="absolute top-1/3 left-1/4 z-[1] h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

      {/* Theme-safe gradient overlay - z-[2] above orbs, below content */}
      <div className="absolute inset-0 z-[2] bg-linear-to-b from-background/95 via-background/80 to-background/95 dark:from-background/90 dark:via-background/70 dark:to-background/90" />

      {/* Content - z-10 above all decorative layers */}
      <div className="relative z-10">{children}</div>
    </main>
  );
}
