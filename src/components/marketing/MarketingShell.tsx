"use client";

import * as React from "react";

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
    <main className="relative min-h-screen bg-background text-foreground overflow-hidden">
      {/* Theme-safe gradient overlays matching Home page treatment */}
      <div className="absolute inset-0 bg-linear-to-b from-background/95 via-background/80 to-background/95 dark:from-background/90 dark:via-background/70 dark:to-background/90" />

      {/* Animated blur orbs - same as Home hero */}
      <div className="absolute -top-40 right-[-10%] h-96 w-96 rounded-full bg-primary/10 blur-3xl motion-safe:animate-pulse" />
      <div className="absolute -bottom-40 left-[-10%] h-96 w-96 rounded-full bg-primary/10 blur-3xl motion-safe:animate-pulse" />
      <div className="absolute top-1/3 left-1/4 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </main>
  );
}
