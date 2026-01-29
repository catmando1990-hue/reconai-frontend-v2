"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";

// Conditional Clerk import - only used when enabled
let useUser: () => {
  user: {
    id: string;
    primaryEmailAddress?: { emailAddress: string };
    fullName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    username?: string | null;
    imageUrl?: string;
    publicMetadata?: Record<string, unknown>;
    unsafeMetadata?: Record<string, unknown>;
    reload: () => Promise<void>;
  } | null;
  isLoaded: boolean;
  isSignedIn: boolean;
};

// Dynamic import check - this runs at module load time
const clerkEnabled = typeof window !== 'undefined'
  ? Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)
  : Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

if (clerkEnabled) {
  // Direct import when Clerk is enabled - no React.lazy() to avoid use() hook issues
  const clerk = require("@clerk/nextjs");
  useUser = clerk.useUser;
}

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

/**
 * Internal Clerk-enabled provider.
 * Uses direct hook calls instead of React.lazy() to avoid React 19 use() hook conflicts.
 */
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

/**
 * UserProfileProvider - Provides user profile context throughout the app.
 *
 * FIX: Removed React.lazy() wrapper that was causing React Error #460
 * "Suspense Exception: This is not a real error!" in React 19.
 *
 * The issue: Clerk internally uses React 19's use() hook which throws
 * a special Suspense exception that must be rethrown. React.lazy()
 * creates an internal boundary that interferes with this mechanism.
 */
export function UserProfileProvider({
  children,
}: {
  children: React.ReactNode;
}) {
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
