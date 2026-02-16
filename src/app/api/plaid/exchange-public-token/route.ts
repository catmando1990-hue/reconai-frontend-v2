import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPlaidClient } from "@/lib/plaid";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { PlaidApi, AccountBase } from "plaid";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * POST /api/plaid/exchange-public-token
 *
 * Exchanges Plaid public token for access token.
 * Stores accounts with proper type/subtype classification.
 * Auto-syncs transactions with normalized amounts.
 */

// Plaid account types that are liabilities (balances represent what you OWE)
const LIABILITY_TYPES = ["credit", "loan"];
const LIABILITY_SUBTYPES = [
  "credit card",
  "paypal",
  "auto",
  "business",
  "commercial",
  "construction",
  "consumer",
  "home equity",
  "loan",
  "mortgage",
  "line of credit",
  "overdraft",
  "student",
];

/**
 * Determine if an account is a liability (debt) vs asset
 */
function isLiabilityAccount(type: string, subtype: string | null): boolean {
  if (LIABILITY_TYPES.includes(type?.toLowerCase())) return true;
  if (subtype && LIABILITY_SUBTYPES.includes(subtype?.toLowerCase()))
    return true;
  return false;
}

/**
 * Get human-readable account label
 */
function getAccountLabel(type: string, subtype: string | null): string {
  const subtypeLabel = subtype
    ? subtype.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : null;
  const typeLabel = type.replace(/\b\w/g, (c) => c.toUpperCase());
  return subtypeLabel || typeLabel;
}

/**
 * Normalize transaction amount based on account type.
 *
 * Plaid convention:
 * - Positive amounts = money leaving the account (debits/expenses)
 * - Negative amounts = money entering the account (credits/deposits)
 *
 * For liability accounts (credit cards, loans):
 * - Positive = purchase (increases debt)
 * - Negative = payment (decreases debt)
 *
 * We normalize to accounting convention:
 * - Positive = money IN (income, deposits, payments received)
 * - Negative = money OUT (expenses, purchases, payments made)
 */
function normalizeAmount(
  plaidAmount: number,
  _accountType: string,
  _accountSubtype: string | null,
): number {
  // Plaid: positive = money out, negative = money in
  // Accounting: positive = money in, negative = money out
  return -plaidAmount;
}

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
    const {
      public_token,
      institution_id,
      institution_name,
      context: rawContext,
    } = body as {
      public_token?: string;
      institution_id?: string;
      institution_name?: string;
      context?: string;
    };

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

    const plaid = getPlaidClient();
    const exchangeResponse = await plaid.itemPublicTokenExchange({
      public_token,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    // Get item details
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

    const supabase = supabaseAdmin();

    // Check for duplicate item
    const { data: existingItem } = await supabase
      .from("plaid_items")
      .select("id, item_id")
      .eq("item_id", itemId)
      .single();

    if (existingItem) {
      // Update existing item
      await supabase
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

      // Fetch and update accounts
      let accountsMap: Map<string, AccountBase>;
      try {
        accountsMap = await fetchAndStoreAccounts(
          plaid,
          supabase,
          accessToken,
          itemId,
          userId,
          institutionId,
          institutionNameResolved,
          context,
        );
      } catch (e: unknown) {
        const msg =
          e instanceof Error ? e.message : "Failed to fetch/store accounts";
        return NextResponse.json(
          { error: msg, code: "ACCOUNTS_STORE_FAILED", request_id: requestId },
          { status: 500, headers: { "x-request-id": requestId } },
        );
      }

      if (!accountsMap || accountsMap.size === 0) {
        return NextResponse.json(
          {
            error:
              "Bank connected but zero accounts were stored. Check Supabase tables and Plaid account permissions.",
            code: "ACCOUNTS_EMPTY",
            request_id: requestId,
          },
          { status: 500, headers: { "x-request-id": requestId } },
        );
      }

      // Sync transactions
      await syncTransactions(
        plaid,
        supabase,
        accessToken,
        itemId,
        userId,
        accountsMap,
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
    const { error: insertItemError } = await supabase
      .from("plaid_items")
      .insert({
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

    if (insertItemError) {
      console.error(
        "[Plaid exchange] Failed to insert plaid_items:",
        insertItemError,
      );
      return NextResponse.json(
        {
          error: insertItemError.message,
          code: "SUPABASE_ERROR",
          request_id: requestId,
        },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    // Fetch and store accounts with proper classification
    let accountsMap: Map<string, AccountBase>;
    try {
      accountsMap = await fetchAndStoreAccounts(
        plaid,
        supabase,
        accessToken,
        itemId,
        userId,
        institutionId,
        institutionNameResolved,
        context,
      );
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Failed to fetch/store accounts";
      return NextResponse.json(
        { error: msg, code: "ACCOUNTS_STORE_FAILED", request_id: requestId },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    if (!accountsMap || accountsMap.size === 0) {
      return NextResponse.json(
        {
          error:
            "Bank connected but zero accounts were stored. Check Supabase tables and Plaid account permissions.",
          code: "ACCOUNTS_EMPTY",
          request_id: requestId,
        },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    // Sync transactions with normalized amounts
    await syncTransactions(
      plaid,
      supabase,
      accessToken,
      itemId,
      userId,
      accountsMap,
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
      response?: { data?: { error_code?: string; error_message?: string } };
    };
    const errorCode = plaidError.response?.data?.error_code || "PLAID_ERROR";
    const errorMessage =
      plaidError.response?.data?.error_message ||
      (err instanceof Error ? err.message : "Failed to exchange token");

    return NextResponse.json(
      { error: errorMessage, code: errorCode, request_id: requestId },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}

/**
 * Fetch accounts from Plaid and store with classification
 */
async function fetchAndStoreAccounts(
  plaid: PlaidApi,
  supabase: SupabaseClient,
  accessToken: string,
  itemId: string,
  userId: string,
  institutionId: string | undefined,
  institutionName: string | undefined,
  context: "personal" | "business",
): Promise<Map<string, AccountBase>> {
  const accountsMap = new Map<string, AccountBase>();

  try {
    const accountsResponse = await plaid.accountsGet({
      access_token: accessToken,
    });

    for (const acct of accountsResponse.data.accounts) {
      accountsMap.set(acct.account_id, acct);

      const isLiability = isLiabilityAccount(acct.type, acct.subtype);
      const accountLabel = getAccountLabel(acct.type, acct.subtype);

      const accountData = {
        user_id: userId,
        clerk_user_id: userId,
        item_id: itemId,
        account_id: acct.account_id,
        institution_id: institutionId,
        institution_name: institutionName,
        context,
        name: acct.name,
        official_name: acct.official_name,
        type: acct.type,
        subtype: acct.subtype,
        account_label: accountLabel,
        is_liability: isLiability,
        mask: acct.mask,
        balance_current: acct.balances.current,
        balance_available: acct.balances.available,
        balance_limit: acct.balances.limit, // Credit limit for credit cards
        iso_currency_code: acct.balances.iso_currency_code || "USD",
        last_synced: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: existing } = await supabase
        .from("plaid_accounts")
        .select("id")
        .eq("account_id", acct.account_id)
        .single();

      if (existing) {
        const { error: updErr } = await supabase
          .from("plaid_accounts")
          .update(accountData)
          .eq("account_id", acct.account_id);
        if (updErr) {
          throw new Error(`SUPABASE_ACCOUNTS_UPDATE_FAILED: ${updErr.message}`);
        }
      } else {
        const { error: insErr } = await supabase.from("plaid_accounts").insert({
          ...accountData,
          created_at: new Date().toISOString(),
        });
        if (insErr) {
          throw new Error(`SUPABASE_ACCOUNTS_INSERT_FAILED: ${insErr.message}`);
        }
      }
    }

    console.log(
      `[Plaid exchange] Stored ${accountsMap.size} accounts for item=${itemId}`,
    );
  } catch (err) {
    console.error("[Plaid exchange] Failed to fetch/store accounts:", err);
    throw err instanceof Error ? err : new Error("PLAID_ACCOUNTS_FETCH_FAILED");
  }

  return accountsMap;
}

/**
 * Sync transactions with normalized amounts and account info
 */
async function syncTransactions(
  plaid: PlaidApi,
  supabase: SupabaseClient,
  accessToken: string,
  itemId: string,
  userId: string,
  accountsMap: Map<string, AccountBase>,
  requestId: string,
): Promise<void> {
  console.log(
    `[Plaid sync] Starting for item=${itemId}, requestId=${requestId}`,
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
        const rows = added.map((tx) => {
          const account = accountsMap.get(tx.account_id);
          const accountType = account?.type || "depository";
          const accountSubtype = account?.subtype || null;
          const isLiability = isLiabilityAccount(accountType, accountSubtype);

          return {
            transaction_id: tx.transaction_id,
            user_id: userId,
            item_id: itemId, // CRITICAL: Tag with item_id
            account_id: tx.account_id,
            account_type: accountType,
            account_subtype: accountSubtype,
            is_liability: isLiability,
            amount: tx.amount, // Keep original Plaid amount
            amount_normalized: normalizeAmount(
              tx.amount,
              accountType,
              accountSubtype,
            ),
            date: tx.date,
            name: tx.name,
            merchant_name: tx.merchant_name,
            category: tx.category,
            category_id: tx.category_id,
            pending: tx.pending,
            payment_channel: tx.payment_channel,
            transaction_type: tx.transaction_type,
            iso_currency_code: tx.iso_currency_code || "USD",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        });

        const { error } = await supabase
          .from("transactions")
          .upsert(rows, { onConflict: "transaction_id" });

        if (error) {
          console.error("[Plaid sync] Insert error:", error);
        } else {
          addedCount += rows.length;
        }
      }

      // Process modified
      for (const tx of modified) {
        const account = accountsMap.get(tx.account_id);
        const accountType = account?.type || "depository";
        const accountSubtype = account?.subtype || null;

        await supabase
          .from("transactions")
          .update({
            amount: tx.amount,
            amount_normalized: normalizeAmount(
              tx.amount,
              accountType,
              accountSubtype,
            ),
            date: tx.date,
            name: tx.name,
            merchant_name: tx.merchant_name,
            category: tx.category,
            pending: tx.pending,
            updated_at: new Date().toISOString(),
          })
          .eq("transaction_id", tx.transaction_id);
      }

      // Process removed
      if (removed.length > 0) {
        await supabase
          .from("transactions")
          .delete()
          .in(
            "transaction_id",
            removed.map((r) => r.transaction_id),
          );
      }

      cursor = next_cursor;
      hasMore = has_more;
    }

    // Save cursor for incremental sync
    await supabase
      .from("plaid_items")
      .update({
        sync_cursor: cursor,
        updated_at: new Date().toISOString(),
      })
      .eq("item_id", itemId);

    console.log(
      `[Plaid sync] Complete: added=${addedCount}, requestId=${requestId}`,
    );
  } catch (err) {
    console.error("[Plaid sync] Failed:", err);
  }
}
