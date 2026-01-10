"use client";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import Link from "next/link";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function HeaderClerkControls() {
  const { resolvedTheme } = useTheme();
  const clerkAppearance = resolvedTheme === "dark" ? { baseTheme: dark } : {};

  return (
    <>
      <SignedIn>
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Dashboard
        </Link>
        <UserButton appearance={clerkAppearance} />
      </SignedIn>

      <SignedOut>
        <Link href="/sign-up">
          <Button variant="ghost" size="sm">
            Sign up
          </Button>
        </Link>
        <Link href="/sign-in">
          <Button size="sm">Sign in</Button>
        </Link>
      </SignedOut>
    </>
  );
}
