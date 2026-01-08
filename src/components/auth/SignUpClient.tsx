"use client";

import dynamic from "next/dynamic";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

const SignUp = dynamic(() => import("@clerk/nextjs").then((m) => m.SignUp), {
  ssr: false,
});

function SignUpContent() {
  const searchParams = useSearchParams();

  const redirectUrl = useMemo(() => {
    const v =
      searchParams.get("redirect_url") || searchParams.get("redirectUrl");
    if (!v) return undefined;
    // Security: Only allow safe relative paths to prevent open redirects
    // Must start with "/" but not "//" or "/\" and contain no protocol
    if (
      v.startsWith("/") &&
      !v.startsWith("//") &&
      !v.startsWith("/\\") &&
      !v.includes(":") &&
      !v.includes("%2f%2f") &&
      !v.includes("%5c")
    ) {
      return v;
    }
    return undefined;
  }, [searchParams]);

  const afterSignUpUrl = redirectUrl ?? "/dashboard";

  return (
    <SignUp
      routing="path"
      path="/sign-up"
      fallbackRedirectUrl={afterSignUpUrl}
      forceRedirectUrl={redirectUrl}
    />
  );
}

export default function SignUpClient() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-background">
      <Suspense
        fallback={<div className="text-muted-foreground">Loading...</div>}
      >
        <SignUpContent />
      </Suspense>
    </div>
  );
}
