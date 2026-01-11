"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";

import { OrganizationSwitcher, useAuth } from "@clerk/nextjs";

function OrgOnboardingContent() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/dashboard";

  const { isLoaded, userId, orgId } = useAuth();

  const canContinue = useMemo(
    () => Boolean(isLoaded && userId && orgId),
    [isLoaded, userId, orgId],
  );

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">
        Choose an organization
      </h1>
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
        To continue, select (or create) an organization. This is required for
        app routes.
      </p>

      <div className="mt-8 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6">
        <div className="flex flex-col gap-4">
          <OrganizationSwitcher
            appearance={{ elements: { rootBox: "w-full", card: "w-full" } }}
            hidePersonal
            organizationProfileMode="navigation"
            organizationProfileUrl="/organization"
            createOrganizationMode="navigation"
            createOrganizationUrl="/organization/create"
          />

          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Back to home
            </Link>

            <Link
              href={canContinue ? returnTo : "#"}
              aria-disabled={!canContinue}
              className={
                canContinue
                  ? "inline-flex items-center justify-center rounded-xl bg-black dark:bg-white px-4 py-2 text-sm font-semibold text-white dark:text-black"
                  : "inline-flex cursor-not-allowed items-center justify-center rounded-xl bg-zinc-200 dark:bg-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400"
              }
            >
              Continue
            </Link>
          </div>

          {!isLoaded ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Loading…</p>
          ) : userId && !orgId ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              You&apos;re signed in, but no active organization is selected.
            </p>
          ) : null}
        </div>
      </div>
    </main>
  );
}

export default function OrgOnboardingPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-2xl px-6 py-16">
          <h1 className="text-3xl font-semibold tracking-tight">
            Choose an organization
          </h1>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Loading...
          </p>
        </main>
      }
    >
      <OrgOnboardingContent />
    </Suspense>
  );
}
