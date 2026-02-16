import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getBackendUrl } from "@/lib/config";

/**
 * GET /api/plaid/accounts
 *
 * Returns Plaid accounts from Supabase for the authenticated user.
 * Source of truth: Supabase `plaid_accounts` table.
 */
export async function GET() {
  const requestId = crypto.randomUUID();

  try {
    const { userId, orgId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }

    const supabase = supabaseAdmin();

    // Debug: log query parameters
    console.log(`[Plaid accounts] Query: userId=${userId}, orgId=${orgId}, requestId=${requestId}`);

    // Debug: Check if user has any plaid_items first
    const { data: items, error: itemsError } = await supabase
      .from("plaid_items")
      .select("item_id, institution_name, status")
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`);

    console.log(`[Plaid accounts] Items check: count=${items?.length ?? 0}, error=${itemsError?.message ?? 'none'}`);
    if (items && items.length > 0) {
      console.log(`[Plaid accounts] Items found:`, items.map(i => ({ item_id: i.item_id, institution: i.institution_name, status: i.status })));
    }

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

    // Debug: log query results
    console.log(`[Plaid accounts] Result: count=${accounts?.length ?? 0}, error=${error?.message ?? 'none'}, requestId=${requestId}`);

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

    // Empty state: try backend as fallback (source may be backend DB, not Supabase)
    if (!accounts || accounts.length === 0) {
      // Attempt backend fetch before declaring not_connected
      try {
        const token = await getToken();
        let backendUrl: string;
        try {
          backendUrl = getBackendUrl();
        } catch {
          backendUrl = "";
        }

        if (backendUrl) {
          const res = await fetch(`${backendUrl}/api/plaid/accounts`, {
            method: "GET",
            headers: {
              "x-request-id": requestId,
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              ...(orgId ? { "x-organization-id": orgId } : {}),
            },
            signal: AbortSignal.timeout(30000),
          });

          if (res.ok) {
            const data = await res.json();
            const backendData = (data && (data.data || data)) || {};
            const backendAccounts =
              backendData.accounts || backendData.items || [];

            if (Array.isArray(backendAccounts) && backendAccounts.length > 0) {
              // Normalize backend accounts into the same response shape used by the UI
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const normalized = backendAccounts.map(
                (acct: Record<string, any>) => ({
                  id: acct.id ?? acct.account_id ?? crypto.randomUUID(),
                  item_id: acct.item_id ?? acct.itemId ?? null,
                  account_id: acct.account_id ?? acct.accountId ?? null,
                  institution_id:
                    acct.institution_id ?? acct.institutionId ?? null,
                  institution_name:
                    acct.institution_name ?? acct.institutionName ?? null,
                  name: acct.name ?? null,
                  official_name:
                    acct.official_name ?? acct.officialName ?? null,
                  type: acct.type ?? null,
                  subtype: acct.subtype ?? null,
                  mask: acct.mask ?? null,
                  balance_current:
                    acct.balance_current ??
                    acct.current_balance ??
                    acct.balances?.current ??
                    null,
                  balance_available:
                    acct.balance_available ??
                    acct.available_balance ??
                    acct.balances?.available ??
                    null,
                  iso_currency_code:
                    acct.iso_currency_code ??
                    acct.currency ??
                    acct.balances?.iso_currency_code ??
                    "USD",
                  last_synced_at:
                    acct.last_synced_at ??
                    acct.last_synced ??
                    acct.updated_at ??
                    null,
                  created_at: acct.created_at ?? null,
                  updated_at: acct.updated_at ?? null,
                }),
              );

              return NextResponse.json(
                {
                  ok: true,
                  accounts: normalized,
                  status: "connected",
                  request_id: requestId,
                },
                { status: 200, headers: { "x-request-id": requestId } },
              );
            }
          } else {
            const errorText = await res.text().catch(() => "");
            console.warn(
              `[Plaid accounts] Backend fallback returned ${res.status}:`,
              errorText,
            );
          }
        }
      } catch (fallbackErr) {
        console.warn("[Plaid accounts] Backend fallback failed:", fallbackErr);
      }

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
