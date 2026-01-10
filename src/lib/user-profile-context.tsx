"use client";

import React, {
  createContext,
  Suspense,
  useCallback,
  useContext,
  useMemo,
} from "react";

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
 * Lazily loaded Clerk-based provider to avoid bundling Clerk on pages that don't need it.
 */
const UserProfileProviderClerkLazy = React.lazy(async () => {
  const { useUser } = await import("@clerk/nextjs");

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

    const error = useMemo<string | null>(() => {
      // Clerk doesn't expose errors via useUser; return null
      return null;
    }, []);

    const value = useMemo<UserProfileContextValue>(
      () => ({
        profile,
        isLoading: !isLoaded,
        error,
        refetch,
      }),
      [profile, isLoaded, error, refetch],
    );

    return (
      <UserProfileContext.Provider value={value}>
        {children}
      </UserProfileContext.Provider>
    );
  }

  return { default: UserProfileProviderClerk };
});

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

  // While the Clerk hooks chunk loads, expose a stable "loading" state.
  return (
    <Suspense
      fallback={
        <UserProfileContext.Provider
          value={{ ...DEFAULT_VALUE, isLoading: true }}
        >
          {children}
        </UserProfileContext.Provider>
      }
    >
      <UserProfileProviderClerkLazy>{children}</UserProfileProviderClerkLazy>
    </Suspense>
  );
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx)
    throw new Error("useUserProfile must be used within <UserProfileProvider>");
  return ctx;
}
