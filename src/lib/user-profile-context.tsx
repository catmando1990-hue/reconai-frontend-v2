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

const DEFAULT_VALUE: UserProfileContextValue = {
  profile: null,
  isLoading: false,
  error: null,
  refetch: async () => {},
};

/**
 * FIX: Wrapped in try-catch with explicit validation
 * The error "Cannot read properties of undefined (reading 'length')"
 * occurs when React.lazy receives undefined from the import.
 */
const UserProfileProviderClerkLazy = React.lazy(async () => {
  try {
    // Step 1: Import Clerk
    const clerkModule = await import("@clerk/nextjs");

    // Step 2: Validate the import
    if (!clerkModule || typeof clerkModule.useUser !== "function") {
      console.error(
        "[UserProfileProvider] Clerk import failed or invalid:",
        clerkModule,
      );
      return {
        default: function UserProfileProviderFallback({
          children,
        }: {
          children: React.ReactNode;
        }) {
          return (
            <UserProfileContext.Provider value={DEFAULT_VALUE}>
              {children}
            </UserProfileContext.Provider>
          );
        },
      };
    }

    const { useUser } = clerkModule;

    // Step 3: Define the component
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

        const role =
          (metadata.role as string | undefined) ??
          ((user.unsafeMetadata as Record<string, unknown>)?.role as
            | string
            | undefined) ??
          null;

        const rawTiers = metadata.tiers;
        const tiers: string[] = Array.isArray(rawTiers)
          ? rawTiers.filter((t): t is string => typeof t === "string")
          : [];

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
        if (user) {
          await user.reload();
        }
      }, [user]);

      const error = useMemo<string | null>(() => null, []);

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

    // Step 4: Validate before returning
    if (typeof UserProfileProviderClerk !== "function") {
      console.error("[UserProfileProvider] Component creation failed");
      throw new Error("UserProfileProviderClerk is not a function");
    }

    return { default: UserProfileProviderClerk };
  } catch (error) {
    console.error("[UserProfileProvider] React.lazy import error:", error);
    return {
      default: function UserProfileProviderError({
        children,
      }: {
        children: React.ReactNode;
      }) {
        return (
          <UserProfileContext.Provider value={DEFAULT_VALUE}>
            {children}
          </UserProfileContext.Provider>
        );
      },
    };
  }
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
