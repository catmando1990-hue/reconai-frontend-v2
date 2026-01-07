"use client";

import dynamic from "next/dynamic";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

const SignIn = dynamic(() => import("@clerk/nextjs").then((m) => m.SignIn), { ssr: false });

function SignInContent() {
  const searchParams = useSearchParams();

  const redirectUrl = useMemo(() => {
    const v = searchParams.get("redirect_url") || searchParams.get("redirectUrl");
    if (!v) return undefined;
    if (v.startsWith("/") && !v.startsWith("//")) return v;
    return undefined;
  }, [searchParams]);

  const afterSignInUrl = redirectUrl ?? "/dashboard";

  return (
    <SignIn
      routing="path"
      path="/sign-in"
      redirectUrl={redirectUrl}
      afterSignInUrl={afterSignInUrl}
      afterSignUpUrl="/dashboard"
    />
  );
}

export default function SignInClient() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-background">
      <Suspense fallback={<div className="text-muted-foreground">Loading...</div>}>
        <SignInContent />
      </Suspense>
    </div>
  );
}
