"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useAuth as useClerkAuth,
  useUser as useClerkUser,
} from "@clerk/nextjs";
import { authApi } from "../api";

const AuthContext = createContext(null);

/**
 * AuthProvider for V2 (Next.js + Clerk).
 *
 * Tokens come from Clerk; user/org context fetched from backend /api/me.
 */
export function AuthProvider({ children }) {
  const clerkAuth = useClerkAuth();
  const clerkUser = useClerkUser();

  const [user, setUser] = useState(null);
  const [org, setOrg] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [tier, setTier] = useState("free");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await authApi.getMe();
      setUser(data.user || data);
      setOrg(data.organization || data.org || null);
      setPermissions(data.permissions || null);
      setTier(data.tier || data.organization?.tier || "free");
    } catch (err) {
      console.warn("[AuthContext] Failed to fetch /api/me:", err.message);
      setError(err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (clerkAuth?.isLoaded && clerkAuth.isSignedIn) {
      fetchUser();
    } else if (clerkAuth?.isLoaded && !clerkAuth.isSignedIn) {
      setLoading(false);
      setUser(null);
    }
  }, [clerkAuth?.isLoaded, clerkAuth?.isSignedIn, fetchUser]);

  const logout = useCallback(async () => {
    if (clerkAuth?.signOut) {
      await clerkAuth.signOut();
    }
    setUser(null);
    setOrg(null);
    setPermissions(null);
    setTier("free");
  }, [clerkAuth]);

  const value = useMemo(
    () => ({
      user: user || clerkUser?.user || null,
      org,
      permissions,
      tier,
      loading: !clerkAuth?.isLoaded || loading,
      error,
      isAuthenticated: !!clerkAuth?.isSignedIn,
      isClerkEnabled: true,
      logout,
      refreshUser: fetchUser,
    }),
    [
      user,
      clerkUser,
      org,
      permissions,
      tier,
      loading,
      error,
      clerkAuth,
      logout,
      fetchUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export default AuthContext;
