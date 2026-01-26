import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Cached client instance for lazy initialization
let _supabaseClient: SupabaseClient | null = null;

/**
 * Check if Supabase is configured (env vars present).
 * Use this to guard Supabase-dependent code paths.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(url && key);
}

/**
 * Get the Supabase admin client lazily.
 * Returns null if Supabase env vars are not configured.
 * This is safe to call during build time - will not throw.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  if (!_supabaseClient) {
    _supabaseClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return _supabaseClient;
}

/**
 * Server-only Supabase admin client (Service Role).
 * IMPORTANT: Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 *
 * Supports both SUPABASE_URL and NEXT_PUBLIC_SUPABASE_URL for flexibility.
 *
 * @throws Error if Supabase is not configured - use getSupabaseAdmin() for a safe alternative.
 */
export function supabaseAdmin(): SupabaseClient {
  const client = getSupabaseAdmin();

  if (!client) {
    throw new Error(
      "Supabase is not configured. Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return client;
}
