"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

const SignIn = dynamic(() => import("@clerk/nextjs").then((m) => m.SignIn), { ssr: false });

export default function SignInClient() {
  const searchParams = useSearchParams();

  const redirectUrl = useMemo(() => {
    const v = searchParams.get("redirect_url") || searchParams.get("redirectUrl");
    if (!v) return undefined;
    if (v.startsWith("/") && !v.startsWith("//")) return v;
    return undefined;
  }, [searchParams]);

  const afterSignInUrl = redirectUrl ?? "/dashboard";

  return (
    <div className="flex min-h-screen items-center justify-center p-6" suppressHydrationWarning>
      <SignIn
        routing="path"
        path="/sign-in"
        redirectUrl={redirectUrl}
        afterSignInUrl={afterSignInUrl}
        afterSignUpUrl="/dashboard"
      />
    </div>
  );
}
