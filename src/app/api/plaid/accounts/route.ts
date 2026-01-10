import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getPlaidClient } from "@/lib/plaid";

type PlaidItemRow = {
  item_id: string;
  access_token: string;
  institution_id?: string | null;
  institution_name?: string | null;
  clerk_user_id?: string | null;
  user_id?: string | null;
};

type AccountRow = {
  clerk_user_id: string;
  user_id: string;
  item_id: string;
  account_id: string;
  institution_id: string | null;
  institution_name: string | null;
  name: string | null;
  official_name: string | null;
  type: string | null;
  subtype: string | null;
  mask: string | null;
  balance_current: number | null;
  balance_available: number | null;
  iso_currency_code: string | null;
  last_synced: string;
};

export async function GET() {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sb = supabaseAdmin();

  // Support both schemas:
  // - new: clerk_user_id
  // - legacy: user_id
  const { data: items, error: itemsErr } = await sb
    .from("plaid_items")
    .select(
      "item_id,access_token,institution_id,institution_name,clerk_user_id,user_id",
    )
    .or(`clerk_user_id.eq.${userId},user_id.eq.${userId}`);

  if (itemsErr) {
    return NextResponse.json(
      { error: "Failed to load Plaid items" },
      { status: 500 },
    );
  }

  const typedItems = (items || []) as PlaidItemRow[];
  if (typedItems.length === 0) {
    return NextResponse.json({ accounts: [] });
  }

  const plaid = getPlaidClient();
  const rowsToUpsert: AccountRow[] = [];

  for (const it of typedItems) {
    const resp = await plaid.accountsGet({ access_token: it.access_token });
    const accounts = resp.data.accounts || [];

    for (const acct of accounts) {
      rowsToUpsert.push({
        clerk_user_id: it.clerk_user_id ?? userId,
        user_id: it.user_id ?? userId,
        item_id: it.item_id,
        account_id: acct.account_id,
        institution_id: it.institution_id ?? null,
        institution_name: it.institution_name ?? null,
        name: acct.name ?? null,
        official_name: acct.official_name ?? null,
        type: acct.type ?? null,
        subtype: acct.subtype ?? null,
        mask: acct.mask ?? null,
        balance_current: acct.balances?.current ?? null,
        balance_available: acct.balances?.available ?? null,
        iso_currency_code: acct.balances?.iso_currency_code ?? null,
        last_synced: new Date().toISOString(),
      });
    }
  }

  if (rowsToUpsert.length > 0) {
    const { error: upsertErr } = await sb
      .from("plaid_accounts")
      .upsert(rowsToUpsert, {
        onConflict: "item_id,account_id",
      });

    if (upsertErr) {
      return NextResponse.json(
        { error: "Failed to persist accounts" },
        { status: 500 },
      );
    }
  }

  // Return safe summary for UI
  const responseAccounts = rowsToUpsert.map((a) => ({
    item_id: a.item_id,
    account_id: a.account_id,
    institution_name: a.institution_name,
    name: a.name,
    official_name: a.official_name,
    type: a.type,
    subtype: a.subtype,
    mask: a.mask,
    balance_current: a.balance_current,
    balance_available: a.balance_available,
    iso_currency_code: a.iso_currency_code,
  }));

  return NextResponse.json({ accounts: responseAccounts });
}
