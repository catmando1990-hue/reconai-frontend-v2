"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useAuth, useOrganization, useUser } from "@clerk/nextjs";

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

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

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
