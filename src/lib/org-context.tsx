"use client";

import React, { createContext, useContext, useMemo } from "react";

// Conditional Clerk import - only used when enabled
let useAuth: () => { isLoaded: boolean; orgId?: string | null; orgRole?: string | null };
let useOrganization: () => { isLoaded: boolean; organization?: { name?: string } | null };
let useUser: () => { isLoaded: boolean; user?: { publicMetadata?: Record<string, unknown>; unsafeMetadata?: Record<string, unknown> } | null };

// Dynamic import check - this runs at module load time
const clerkEnabled = typeof window !== 'undefined'
  ? Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
  : Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

if (clerkEnabled) {
  // Direct import when Clerk is enabled - no React.lazy() to avoid use() hook issues
  const clerk = require("@clerk/nextjs");
  useAuth = clerk.useAuth;
  useOrganization = clerk.useOrganization;
  useUser = clerk.useUser;
}

export type OrgContextValue = {
  org_id: string | null;
  org_name: string | null;
  role: string | null; // effective role used for tier gating
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
 * Internal Clerk-enabled provider.
 * Uses direct hook calls instead of React.lazy() to avoid React 19 use() hook conflicts.
 */
function OrgProviderClerk({ children }: { children: React.ReactNode }) {
  const { isLoaded: authLoaded, orgId, orgRole } = useAuth();
  const { isLoaded: orgLoaded, organization } = useOrganization();
  const { isLoaded: userLoaded, user } = useUser();

  // Preferred: user-level role from publicMetadata (works even without org selected)
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

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

/**
 * OrgProvider - Provides organization context throughout the app.
 *
 * FIX: Removed React.lazy() wrapper that was causing React Error #460
 * "Suspense Exception: This is not a real error!" in React 19.
 *
 * The issue: Clerk internally uses React 19's use() hook which throws
 * a special Suspense exception that must be rethrown. React.lazy()
 * creates an internal boundary that interferes with this mechanism.
 */
export function OrgProvider({ children }: { children: React.ReactNode }) {
  if (!clerkEnabled) {
    return (
      <OrgContext.Provider value={DEFAULT_ORG_CONTEXT}>
        {children}
      </OrgContext.Provider>
    );
  }

  return <OrgProviderClerk>{children}</OrgProviderClerk>;
}

export function useOrg() {
  return useContext(OrgContext);
}
