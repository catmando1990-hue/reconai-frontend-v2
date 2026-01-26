import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/plaid/stored-accounts
 *
 * Returns Plaid accounts from Supabase for the authenticated user.
 * Used by the Statements page for account selection dropdown.
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

    const { data: accounts, error } = await supabase
      .from("plaid_accounts")
      .select(
        `
        account_id,
        name,
        official_name,
        mask,
        type,
        subtype,
        institution_name
      `,
      )
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`)
      .order("institution_name", { ascending: true });

    if (error) {
      console.error("[stored-accounts] Supabase error:", error);
      return NextResponse.json(
        {
          ok: false,
          error: { code: "SUPABASE_ERROR", message: error.message },
          request_id: requestId,
        },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        accounts: accounts || [],
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[stored-accounts] Unhandled error:", err);
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
