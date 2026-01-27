import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPlaidClient } from "@/lib/plaid";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { PlaidApi } from "plaid";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * POST /api/plaid/exchange-public-token
 *
 * Exchanges Plaid public token for access token.
 * Calls Plaid API directly, then writes to Supabase.
 * Auto-syncs transactions after successful connection.
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
    const { public_token, institution_id, institution_name, context: rawContext } = body as {
      public_token?: string;
      institution_id?: string;
      institution_name?: string;
      context?: string;
    };

    // Validate context — defaults to "personal" for Core, "business" for CFO
    const context: "personal" | "business" =
      rawContext === "business" ? "business" : "personal";

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
      `[Plaid exchange] userId=${userId}, context=${context}, institution=${institution_name || "unknown"}, requestId=${requestId}`,
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
          context,
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

      // Sync transactions for existing item
      await syncTransactions(
        plaid,
        supabase,
        accessToken,
        itemId,
        userId,
        requestId,
      );

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
      context,
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
        context,
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

      // Insert accounts one by one, handling duplicates manually
      for (const acct of accounts) {
        const { data: existing } = await supabase
          .from("plaid_accounts")
          .select("id")
          .eq("account_id", acct.account_id)
          .single();

        if (existing) {
          const { error: updateErr } = await supabase
            .from("plaid_accounts")
            .update({
              name: acct.name,
              official_name: acct.official_name,
              type: acct.type,
              subtype: acct.subtype,
              mask: acct.mask,
              balance_current: acct.balance_current,
              balance_available: acct.balance_available,
              iso_currency_code: acct.iso_currency_code,
              context: acct.context,
              last_synced: acct.last_synced,
              updated_at: acct.updated_at,
            })
            .eq("account_id", acct.account_id);

          if (updateErr) {
            console.error(
              "[Plaid exchange] Failed to update account:",
              updateErr,
            );
          }
        } else {
          const { error: insertErr } = await supabase
            .from("plaid_accounts")
            .insert(acct);

          if (insertErr) {
            console.error(
              "[Plaid exchange] Failed to insert account:",
              insertErr,
            );
          }
        }
      }
    } catch (acctErr) {
      console.warn("[Plaid exchange] Could not fetch accounts:", acctErr);
    }

    // Sync transactions immediately after successful connection
    await syncTransactions(
      plaid,
      supabase,
      accessToken,
      itemId,
      userId,
      requestId,
    );

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

/**
 * Sync transactions from Plaid to Supabase using /transactions/sync endpoint.
 */
async function syncTransactions(
  plaid: PlaidApi,
  supabase: SupabaseClient,
  accessToken: string,
  itemId: string,
  userId: string,
  requestId: string,
): Promise<void> {
  console.log(
    `[Plaid sync] Starting auto-sync for item=${itemId}, requestId=${requestId}`,
  );

  try {
    let cursor: string | undefined = undefined;
    let hasMore = true;
    let addedCount = 0;

    while (hasMore) {
      const syncResponse = await plaid.transactionsSync({
        access_token: accessToken,
        cursor: cursor,
        count: 100,
      });

      const { added, modified, removed, next_cursor, has_more } =
        syncResponse.data;

      // Process added transactions
      if (added.length > 0) {
        const addedRows = added.map((tx) => ({
          transaction_id: tx.transaction_id,
          user_id: userId,
          account_id: tx.account_id,
          amount: tx.amount,
          date: tx.date,
          name: tx.name,
          merchant_name: tx.merchant_name ?? undefined,
          category: tx.category ?? undefined,
          pending: tx.pending,
          payment_channel: tx.payment_channel ?? undefined,
          transaction_type: tx.transaction_type ?? undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        // Insert transactions, handling duplicates
        for (const row of addedRows) {
          const { data: existing } = await supabase
            .from("transactions")
            .select("id")
            .eq("transaction_id", row.transaction_id)
            .single();

          if (!existing) {
            const { error: insertErr } = await supabase
              .from("transactions")
              .insert(row);

            if (!insertErr) {
              addedCount++;
            } else {
              console.error(
                "[Plaid sync] Failed to insert transaction:",
                insertErr,
              );
            }
          }
        }
      }

      // Process modified transactions
      for (const tx of modified) {
        await supabase
          .from("transactions")
          .update({
            amount: tx.amount,
            date: tx.date,
            name: tx.name,
            merchant_name: tx.merchant_name ?? undefined,
            category: tx.category ?? undefined,
            pending: tx.pending,
            payment_channel: tx.payment_channel ?? undefined,
            transaction_type: tx.transaction_type ?? undefined,
            updated_at: new Date().toISOString(),
          })
          .eq("transaction_id", tx.transaction_id);
      }

      // Process removed transactions
      if (removed.length > 0) {
        const removedIds = removed.map((r) => r.transaction_id);
        await supabase
          .from("transactions")
          .delete()
          .in("transaction_id", removedIds);
      }

      cursor = next_cursor;
      hasMore = has_more;
    }

    // Update item's last synced timestamp
    await supabase
      .from("plaid_items")
      .update({ updated_at: new Date().toISOString() })
      .eq("item_id", itemId);

    console.log(
      `[Plaid sync] Complete: added=${addedCount}, requestId=${requestId}`,
    );
  } catch (syncErr) {
    console.error("[Plaid sync] Auto-sync failed:", syncErr);
    // Non-fatal — connection is saved, user can sync later
  }
}
