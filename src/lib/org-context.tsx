"use client";

import React, { Suspense, createContext, useContext, useMemo } from "react";

export type OrgContextValue = {
  org_id: string | null;
  org_name: string | null;
  role: string | null;
  isLoaded: boolean;
};

const DEFAULT_ORG_CONTEXT: OrgContextValue = {
  org_id: null,
  org_name: null,
  role: null,
  isLoaded: true,
};

const OrgContext = createContext<OrgContextValue>(DEFAULT_ORG_CONTEXT);

/**
 * FIX: Wrapped in try-catch with explicit validation
 * The error "Cannot read properties of undefined (reading 'length')"
 * occurs when React.lazy receives undefined from the import.
 */
const OrgProviderClerkLazy = React.lazy(async () => {
  try {
    // Step 1: Import Clerk hooks
    const clerkModule = await import("@clerk/nextjs");

    // Step 2: Validate the import worked
    if (!clerkModule || typeof clerkModule.useAuth !== "function") {
      console.error(
        "[OrgProvider] Clerk import failed or invalid:",
        clerkModule,
      );
      // Return a fallback component that just passes through children
      return {
        default: function OrgProviderFallback({
          children,
        }: {
          children: React.ReactNode;
        }) {
          return (
            <OrgContext.Provider value={DEFAULT_ORG_CONTEXT}>
              {children}
            </OrgContext.Provider>
          );
        },
      };
    }

    const { useAuth, useOrganization, useUser } = clerkModule;

    // Step 3: Define the component
    function OrgProviderClerk({ children }: { children: React.ReactNode }) {
      const { isLoaded: authLoaded, orgId, orgRole } = useAuth();
      const { isLoaded: orgLoaded, organization } = useOrganization();
      const { isLoaded: userLoaded, user } = useUser();

      const userRole = user
        ? ((user.publicMetadata as Record<string, unknown>)?.role as
            | string
            | undefined) ||
          ((user.unsafeMetadata as Record<string, unknown>)?.role as
            | string
            | undefined) ||
          null
        : null;

      const effectiveRole = userRole ?? orgRole ?? null;

      const value = useMemo<OrgContextValue>(
        () => ({
          org_id: orgId ?? null,
          org_name: organization?.name ?? null,
          role: effectiveRole,
          isLoaded: authLoaded && orgLoaded && userLoaded,
        }),
        [
          authLoaded,
          orgLoaded,
          userLoaded,
          orgId,
          effectiveRole,
          organization?.name,
        ],
      );

      return (
        <OrgContext.Provider value={value}>{children}</OrgContext.Provider>
      );
    }

    // Step 4: Validate the component before returning
    if (typeof OrgProviderClerk !== "function") {
      console.error("[OrgProvider] Component creation failed");
      throw new Error("OrgProviderClerk is not a function");
    }

    return { default: OrgProviderClerk };
  } catch (error) {
    console.error("[OrgProvider] React.lazy import error:", error);
    // Return a fallback that doesn't crash
    return {
      default: function OrgProviderError({
        children,
      }: {
        children: React.ReactNode;
      }) {
        return (
          <OrgContext.Provider value={DEFAULT_ORG_CONTEXT}>
            {children}
          </OrgContext.Provider>
        );
      },
    };
  }
});

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  if (!clerkEnabled) {
    return (
      <OrgContext.Provider value={DEFAULT_ORG_CONTEXT}>
        {children}
      </OrgContext.Provider>
    );
  }

  return (
    <Suspense
      fallback={
        <OrgContext.Provider
          value={{ ...DEFAULT_ORG_CONTEXT, isLoaded: false }}
        >
          {children}
        </OrgContext.Provider>
      }
    >
      <OrgProviderClerkLazy>{children}</OrgProviderClerkLazy>
    </Suspense>
  );
}

export function useOrg() {
  return useContext(OrgContext);
}
