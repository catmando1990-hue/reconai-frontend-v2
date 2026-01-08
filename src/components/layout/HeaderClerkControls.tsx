"use client";

import { useAuth } from "@clerk/nextjs";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import Link from "next/link";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function HeaderClerkControls() {
  const { isLoaded, isSignedIn } = useAuth();
  const { resolvedTheme } = useTheme();
  const clerkAppearance = resolvedTheme === "dark" ? { baseTheme: dark } : {};

  // Show loading skeleton while Clerk is loading
  if (!isLoaded) {
    return <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />;
  }

  if (isSignedIn) {
    return (
      <>
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Dashboard
        </Link>
        <UserButton afterSignOutUrl="/" appearance={clerkAppearance} />
      </>
    );
  }

  return (
    <>
      <SignUpButton mode="modal">
        <Button variant="ghost" size="sm">
          Sign up
        </Button>
      </SignUpButton>
      <SignInButton mode="modal">
        <Button size="sm">Sign in</Button>
      </SignInButton>
    </>
  );
}
