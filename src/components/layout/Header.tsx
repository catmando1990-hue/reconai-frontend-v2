"use client";

import Link from "next/link";
import React, { Suspense } from "react";

const HeaderClerkControlsLazy = React.lazy(async () => {
  const mod = await import("@/components/layout/HeaderClerkControls");
  return { default: mod.HeaderClerkControls };
});

export function Header() {
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  return (
    <header className="w-full border-b border-border bg-background text-foreground">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-sm font-semibold">
          ReconAI
        </Link>

        <nav className="flex items-center gap-2">
          {clerkEnabled ? (
            <Suspense
              fallback={
                <Link
                  href="/dashboard"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Dashboard
                </Link>
              }
            >
              <HeaderClerkControlsLazy />
            </Suspense>
          ) : (
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
