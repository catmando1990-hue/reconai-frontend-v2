import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/statements
 *
 * List all bank statements for the authenticated user.
 * Optional account_id filter.
 */

export async function GET(req: Request) {
  const requestId = crypto.randomUUID();

  try {
    // Lazy initialization - safe during build
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { error: "Storage service not configured", request_id: requestId },
        { status: 503, headers: { "x-request-id": requestId } },
      );
    }

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }

    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("account_id");

    let query = supabase
      .from("bank_statements")
      .select("*")
      .eq("user_id", userId)
      .order("uploaded_at", { ascending: false });

    if (accountId) {
      query = query.eq("account_id", accountId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Statements] Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch statements", request_id: requestId },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    return NextResponse.json(
      { statements: data || [], request_id: requestId },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (error) {
    console.error("[Statements] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
