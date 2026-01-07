'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useApi } from '@/lib/useApi';

export type UserProfile = {
  id?: string;
  email?: string;
  name?: string;
  [key: string]: unknown;
};

export type UserProfileContextValue = {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const { apiFetch } = useApi();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Pass a custom onUnauthorized handler to prevent redirect on public pages
      const data = await apiFetch<UserProfile>('/api/auth/me', {
        onUnauthorized: () => {
          // Don't redirect - just treat as no profile (user not signed in)
        },
      });
      setProfile(data ?? null);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load profile';
      setError(message);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    void refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<UserProfileContextValue>(
    () => ({ profile, isLoading, error, refetch }),
    [profile, isLoading, error, refetch]
  );

  return <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>;
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error('useUserProfile must be used within <UserProfileProvider>');
  return ctx;
}
