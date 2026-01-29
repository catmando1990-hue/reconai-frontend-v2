"use client";

import React, { createContext, useCallback, useContext, useMemo } from "react";
import { useUser } from "@clerk/nextjs";

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  imageUrl?: string;
  role: string | null;
  tiers: string[];
  internal: boolean;
};

export type UserProfileContextValue = {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

/**
 * Default context value when Clerk is not enabled or user is not signed in.
 */
const DEFAULT_VALUE: UserProfileContextValue = {
  profile: null,
  isLoading: false,
  error: null,
  refetch: async () => {},
};

function UserProfileProviderClerk({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded, isSignedIn } = useUser();

  const profile = useMemo<UserProfile | null>(() => {
    if (!isLoaded || !isSignedIn || !user) {
      return null;
    }

    const metadata = (user.publicMetadata ?? {}) as Record<string, unknown>;

    // Extract role - check publicMetadata first, then unsafeMetadata as fallback
    const role =
      (metadata.role as string | undefined) ??
      ((user.unsafeMetadata as Record<string, unknown>)?.role as
        | string
        | undefined) ??
      null;

    // Extract tiers - ensure it's an array of strings
    const rawTiers = metadata.tiers;
    const tiers: string[] = Array.isArray(rawTiers)
      ? rawTiers.filter((t): t is string => typeof t === "string")
      : [];

    // Extract internal flag
    const internal = metadata.internal === true;

    return {
      id: user.id,
      email: user.primaryEmailAddress?.emailAddress ?? "",
      name:
        user.fullName ??
        (`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
          user.username) ??
        "",
      imageUrl: user.imageUrl,
      role,
      tiers,
      internal,
    };
  }, [user, isLoaded, isSignedIn]);

  const refetch = useCallback(async () => {
    // Clerk manages its own state; reload user data from Clerk
    if (user) {
      await user.reload();
    }
  }, [user]);

  const value = useMemo<UserProfileContextValue>(
    () => ({
      profile,
      isLoading: !isLoaded,
      error: null,
      refetch,
    }),
    [profile, isLoaded, refetch],
  );

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function UserProfileProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  if (!clerkEnabled) {
    return (
      <UserProfileContext.Provider value={DEFAULT_VALUE}>
        {children}
      </UserProfileContext.Provider>
    );
  }

  return <UserProfileProviderClerk>{children}</UserProfileProviderClerk>;
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx)
    throw new Error("useUserProfile must be used within <UserProfileProvider>");
  return ctx;
}
