"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense } from "react";

const HeaderClerkControls = dynamic(
  () =>
    import("@/components/layout/HeaderClerkControls").then(
      (mod) => mod.HeaderClerkControls,
    ),
  { ssr: false },
);

export function Header() {
  return (
    <header className="w-full border-b border-border bg-background text-foreground">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-sm font-semibold">
          ReconAI
        </Link>

        <nav className="flex items-center gap-2">
          <Suspense
            fallback={
              <div className="h-8 w-16 animate-pulse rounded-md bg-muted" />
            }
          >
            <HeaderClerkControls />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}
