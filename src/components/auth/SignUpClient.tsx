"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { dark } from "@clerk/themes";

const SignUp = dynamic(() => import("@clerk/nextjs").then((m) => m.SignUp), {
  ssr: false,
});

function SignUpContent() {
  const searchParams = useSearchParams();
  const { resolvedTheme } = useTheme();
  const clerkAppearance = resolvedTheme === "dark" ? { baseTheme: dark } : {};

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
      appearance={clerkAppearance}
    />
  );
}

export default function SignUpClient() {
  return (
    <div className="relative flex min-h-dvh items-center justify-center p-4 sm:p-6 bg-background overflow-hidden">
      {/* Hero background */}
      <Image
        src="/hero-boardroom.jpg"
        alt=""
        fill
        className="object-cover opacity-25 dark:opacity-35"
        aria-hidden="true"
        priority
      />
      {/* Gradient overlay for readability */}
      <div className="absolute inset-0 bg-linear-to-b from-background/80 via-background/60 to-background/80 dark:from-background/70 dark:via-background/50 dark:to-background/70" />

      <Suspense
        fallback={<div className="text-muted-foreground">Loading...</div>}
      >
        <div className="relative z-10">
          <SignUpContent />
        </div>
      </Suspense>
    </div>
  );
}
