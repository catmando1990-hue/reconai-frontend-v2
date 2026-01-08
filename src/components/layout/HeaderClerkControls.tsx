"use client";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
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
        <UserButton afterSignOutUrl="/" appearance={clerkAppearance} />
      </SignedIn>

      <SignedOut>
        <SignUpButton mode="modal">
          <Button variant="ghost" size="sm">
            Sign up
          </Button>
        </SignUpButton>
        <SignInButton mode="modal">
          <Button size="sm">Sign in</Button>
        </SignInButton>
      </SignedOut>
    </>
  );
}
