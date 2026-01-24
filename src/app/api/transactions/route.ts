import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/transactions
 *
 * Returns transactions from Supabase for the authenticated user.
 * Source of truth: Supabase `transactions` table.
 */
export async function GET(req: Request) {
  const requestId = crypto.randomUUID();

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);
    const offset = parseInt(url.searchParams.get("offset") || "0", 10);

    const supabase = supabaseAdmin();

    // Query transactions table
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select(
        `
        id,
        transaction_id,
        account_id,
        amount,
        date,
        name,
        merchant_name,
        category,
        pending,
        payment_channel,
        transaction_type,
        created_at,
        updated_at
      `,
      )
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[Transactions] Supabase error:", error);
      // Return empty array on error — graceful degradation
      return NextResponse.json([], {
        status: 200,
        headers: { "x-request-id": requestId },
      });
    }

    // Map to frontend expected format
    const mapped = (transactions || []).map((tx) => ({
      id: tx.id || tx.transaction_id,
      date: tx.date,
      merchant: tx.merchant_name || tx.name,
      description: tx.name,
      amount: tx.amount,
      account: tx.account_id,
      category: Array.isArray(tx.category) ? tx.category[0] : tx.category,
      pending: tx.pending,
      duplicate: false, // Would need separate duplicate detection
    }));

    return NextResponse.json(mapped, {
      status: 200,
      headers: { "x-request-id": requestId },
    });
  } catch (err) {
    console.error("[Transactions] Unhandled error:", err);
    // Return empty array on error
    return NextResponse.json([], {
      status: 200,
      headers: { "x-request-id": requestId },
    });
  }
}
