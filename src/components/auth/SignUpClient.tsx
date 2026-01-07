"use client";

import dynamic from "next/dynamic";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

const SignUp = dynamic(() => import("@clerk/nextjs").then((m) => m.SignUp), { ssr: false });

function SignUpContent() {
  const searchParams = useSearchParams();

  const redirectUrl = useMemo(() => {
    const v = searchParams.get("redirect_url") || searchParams.get("redirectUrl");
    if (!v) return undefined;
    if (v.startsWith("/") && !v.startsWith("//")) return v;
    return undefined;
  }, [searchParams]);

  const afterSignUpUrl = redirectUrl ?? "/dashboard";

  return (
    <SignUp
      routing="path"
      path="/sign-up"
      redirectUrl={redirectUrl}
      afterSignUpUrl={afterSignUpUrl}
      afterSignInUrl="/dashboard"
    />
  );
}

export default function SignUpClient() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-background">
      <Suspense fallback={<div className="text-muted-foreground">Loading...</div>}>
        <SignUpContent />
      </Suspense>
    </div>
  );
}
