'use client';

import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export function HeaderClerkControls() {
  return (
    <>
      <SignedIn>
        <Link href="/dashboard" className="text-sm text-zinc-700 hover:text-zinc-900">
          Dashboard
        </Link>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>

      <SignedOut>
        <SignInButton mode="modal">
          <Button size="sm">Sign in</Button>
        </SignInButton>
      </SignedOut>
    </>
  );
}
