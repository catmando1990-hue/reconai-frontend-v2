"use client";

import dynamic from "next/dynamic";

// Disable SSR for Clerk UI to prevent hydration mismatch under Turbopack
const SignIn = dynamic(() => import("@clerk/nextjs").then((m) => m.SignIn), {
  ssr: false,
});

export default function SignInClient() {
  return (
    <div className="flex min-h-screen items-center justify-center" suppressHydrationWarning>
      <SignIn routing="path" path="/sign-in" />
    </div>
  );
}
