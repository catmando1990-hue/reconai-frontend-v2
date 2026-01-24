import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/plaid/accounts
 *
 * Returns Plaid accounts from Supabase for the authenticated user.
 * Source of truth: Supabase `plaid_accounts` table.
 */
export async function GET() {
  const requestId = crypto.randomUUID();

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }

    const supabase = supabaseAdmin();

    // Query plaid_accounts joined with user's items
    // First get user's item_ids, then get accounts for those items
    const { data: accounts, error } = await supabase
      .from("plaid_accounts")
      .select(
        `
        id,
        item_id,
        account_id,
        institution_id,
        institution_name,
        name,
        official_name,
        type,
        subtype,
        mask,
        balance_current,
        balance_available,
        iso_currency_code,
        last_synced,
        created_at,
        updated_at
      `,
      )
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Plaid accounts] Supabase error:", error);
      return NextResponse.json(
        {
          ok: false,
          error: { code: "SUPABASE_ERROR", message: error.message },
          request_id: requestId,
        },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    // Empty state is valid — user hasn't connected or synced yet
    if (!accounts || accounts.length === 0) {
      return NextResponse.json(
        {
          ok: true,
          accounts: [],
          status: "not_connected",
          message: "No bank accounts connected yet",
          request_id: requestId,
        },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    // Map to expected response shape
    const mappedAccounts = accounts.map((acct) => ({
      id: acct.id,
      item_id: acct.item_id,
      account_id: acct.account_id,
      institution_id: acct.institution_id,
      institution_name: acct.institution_name,
      name: acct.name,
      official_name: acct.official_name,
      type: acct.type,
      subtype: acct.subtype,
      mask: acct.mask,
      balance_current: acct.balance_current,
      balance_available: acct.balance_available,
      iso_currency_code: acct.iso_currency_code || "USD",
      last_synced_at: acct.last_synced,
      created_at: acct.created_at,
      updated_at: acct.updated_at,
    }));

    return NextResponse.json(
      {
        ok: true,
        accounts: mappedAccounts,
        status: "connected",
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[Plaid accounts] Unhandled error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INTERNAL_ERROR", message },
        request_id: requestId,
      },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
