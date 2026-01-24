import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPlaidClient } from "@/lib/plaid";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * POST /api/plaid/exchange-public-token
 *
 * Exchanges Plaid public token for access token.
 * Calls Plaid API directly, then writes to Supabase.
 *
 * SECURITY: Access token is stored in Supabase, never returned to client.
 */
export async function POST(req: Request) {
  const requestId = crypto.randomUUID();

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const { public_token, institution_id, institution_name } = body as {
      public_token?: string;
      institution_id?: string;
      institution_name?: string;
    };

    if (!public_token || typeof public_token !== "string") {
      return NextResponse.json(
        {
          error: "Missing public_token",
          code: "MISSING_PUBLIC_TOKEN",
          request_id: requestId,
        },
        { status: 400, headers: { "x-request-id": requestId } },
      );
    }

    console.log(
      `[Plaid exchange] userId=${userId}, institution=${institution_name || "unknown"}, requestId=${requestId}`,
    );

    // Exchange public token for access token via Plaid API
    const plaid = getPlaidClient();
    const exchangeResponse = await plaid.itemPublicTokenExchange({
      public_token,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    // Get item details to confirm institution
    let institutionId = institution_id;
    let institutionNameResolved = institution_name;

    try {
      const itemResponse = await plaid.itemGet({ access_token: accessToken });
      institutionId = itemResponse.data.item.institution_id || institutionId;

      if (institutionId && !institutionNameResolved) {
        const instResponse = await plaid.institutionsGetById({
          institution_id: institutionId,
          country_codes: ["US" as never],
        });
        institutionNameResolved = instResponse.data.institution.name;
      }
    } catch (itemErr) {
      console.warn("[Plaid exchange] Could not fetch item details:", itemErr);
    }

    // Write to Supabase
    const supabase = supabaseAdmin();

    // Check for duplicate item
    const { data: existingItem } = await supabase
      .from("plaid_items")
      .select("id, item_id")
      .eq("item_id", itemId)
      .single();

    if (existingItem) {
      // Update existing item
      const { error: updateError } = await supabase
        .from("plaid_items")
        .update({
          access_token: accessToken,
          institution_id: institutionId,
          institution_name: institutionNameResolved,
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("item_id", itemId);

      if (updateError) {
        console.error("[Plaid exchange] Supabase update error:", updateError);
        return NextResponse.json(
          {
            error: "Failed to update bank connection",
            code: "SUPABASE_ERROR",
            request_id: requestId,
          },
          { status: 500, headers: { "x-request-id": requestId } },
        );
      }

      return NextResponse.json(
        {
          item_id: itemId,
          status: "connected",
          is_duplicate: true,
          request_id: requestId,
        },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    // Insert new item
    const { error: insertError } = await supabase.from("plaid_items").insert({
      user_id: userId,
      clerk_user_id: userId,
      item_id: itemId,
      access_token: accessToken,
      institution_id: institutionId,
      institution_name: institutionNameResolved,
      status: "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("[Plaid exchange] Supabase insert error:", insertError);
      return NextResponse.json(
        {
          error: "Failed to save bank connection",
          code: "SUPABASE_ERROR",
          request_id: requestId,
        },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    // Fetch accounts and store them
    try {
      const accountsResponse = await plaid.accountsGet({
        access_token: accessToken,
      });

      const accounts = accountsResponse.data.accounts.map((acct) => ({
        user_id: userId,
        clerk_user_id: userId,
        item_id: itemId,
        account_id: acct.account_id,
        institution_id: institutionId,
        institution_name: institutionNameResolved,
        name: acct.name,
        official_name: acct.official_name,
        type: acct.type,
        subtype: acct.subtype,
        mask: acct.mask,
        balance_current: acct.balances.current,
        balance_available: acct.balances.available,
        iso_currency_code: acct.balances.iso_currency_code || "USD",
        last_synced: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      if (accounts.length > 0) {
        const { error: accountsError } = await supabase
          .from("plaid_accounts")
          .upsert(accounts, { onConflict: "account_id" });

        if (accountsError) {
          console.error(
            "[Plaid exchange] Failed to save accounts:",
            accountsError,
          );
          // Non-fatal — item is saved, accounts can be synced later
        }
      }
    } catch (acctErr) {
      console.warn("[Plaid exchange] Could not fetch accounts:", acctErr);
      // Non-fatal
    }

    return NextResponse.json(
      {
        item_id: itemId,
        status: "connected",
        is_duplicate: false,
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err: unknown) {
    console.error("[Plaid exchange] Error:", err);

    // Extract Plaid error details if available
    const plaidError = err as {
      response?: {
        data?: {
          error_code?: string;
          error_message?: string;
        };
      };
    };
    const errorCode = plaidError.response?.data?.error_code || "PLAID_ERROR";
    const errorMessage =
      plaidError.response?.data?.error_message ||
      (err instanceof Error ? err.message : "Failed to exchange token");

    return NextResponse.json(
      {
        error: errorMessage,
        code: errorCode,
        request_id: requestId,
      },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
