"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

const SignUp = dynamic(() => import("@clerk/nextjs").then((m) => m.SignUp), { ssr: false });

export default function SignUpClient() {
  const searchParams = useSearchParams();

  const redirectUrl = useMemo(() => {
    const v = searchParams.get("redirect_url") || searchParams.get("redirectUrl");
    if (!v) return undefined;
    if (v.startsWith("/") && !v.startsWith("//")) return v;
    return undefined;
  }, [searchParams]);

  const afterSignUpUrl = redirectUrl ?? "/dashboard";

  return (
    <div className="flex min-h-screen items-center justify-center p-6" suppressHydrationWarning>
      <SignUp
        routing="path"
        path="/sign-up"
        redirectUrl={redirectUrl}
        afterSignUpUrl={afterSignUpUrl}
        afterSignInUrl="/dashboard"
      />
    </div>
  );
}
