"use client";

import dynamic from "next/dynamic";

// Disable SSR for Clerk UI to prevent hydration mismatch under Turbopack
const SignUp = dynamic(() => import("@clerk/nextjs").then((m) => m.SignUp), {
  ssr: false,
});

export default function SignUpClient() {
  return (
    <div className="flex min-h-screen items-center justify-center" suppressHydrationWarning>
      <SignUp routing="path" path="/sign-up" />
    </div>
  );
}
