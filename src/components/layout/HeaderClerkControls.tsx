"use client";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Menu } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function HeaderClerkControls() {
  const { resolvedTheme } = useTheme();
  const clerkAppearance = resolvedTheme === "dark" ? { baseTheme: dark } : {};

  return (
    <div className="flex items-center gap-2">
      <SignedIn>
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Dashboard
        </Link>
        <UserButton
          appearance={clerkAppearance}
          userProfileMode="navigation"
          userProfileUrl="/account"
        />
      </SignedIn>

      <SignedOut>
        <Link href="/sign-in">
          <Button size="sm">Sign in</Button>
        </Link>
        <Link href="/sign-up">
          <Button variant="ghost" size="sm">
            Sign up
          </Button>
        </Link>
      </SignedOut>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Menu className="h-4 w-4" />
            <span className="sr-only">Menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <SignedIn>
            <DropdownMenuItem asChild>
              <Link href="/account">Account</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </SignedIn>
          <DropdownMenuItem asChild>
            <Link href="/about">About</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/privacy">Privacy</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/terms">Terms</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/legal">Legal</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
