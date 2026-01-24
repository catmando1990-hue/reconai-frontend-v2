import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase admin client (Service Role).
 * IMPORTANT: Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 *
 * Supports both SUPABASE_URL and NEXT_PUBLIC_SUPABASE_URL for flexibility.
 */
export function supabaseAdmin() {
  const url =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("Missing env var: SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!key) {
    throw new Error("Missing env var: SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
