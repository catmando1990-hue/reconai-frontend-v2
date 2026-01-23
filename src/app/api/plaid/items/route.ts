import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: Request) {
  // Generate request ID for provenance tracking
  const incomingRequestId = req.headers.get("x-request-id");
  const requestId = incomingRequestId || crypto.randomUUID();

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized",
          code: "AUTH_REQUIRED",
          request_id: requestId,
        },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }

    const sb = supabaseAdmin();
    const { data, error } = await sb
      .from("plaid_items")
      .select("item_id,status,created_at,updated_at")
      .eq("clerk_user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Plaid items] Supabase error:", error);
      return NextResponse.json(
        {
          ok: false,
          error: "Failed to load connected accounts",
          code: "DB_ERROR",
          request_id: requestId,
        },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    // ========================================================================
    // ORDERING GUARD: Return 400 if NO Plaid Item exists (before Link)
    // This prevents premature calls to /items before exchange-public-token
    // Frontend should show "No bank connected yet" - NOT an error state
    // ========================================================================
    if (!data || data.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          status: "no_item",
          reason: "No Plaid Item exists. Complete Plaid Link first.",
          code: "NO_PLAID_ITEM",
          message: "No bank connected yet",
          request_id: requestId,
        },
        { status: 400, headers: { "x-request-id": requestId } },
      );
    }

    return NextResponse.json(
      { ok: true, items: data, request_id: requestId },
      { headers: { "x-request-id": requestId } },
    );
  } catch (err: unknown) {
    console.error("[Plaid items] Unhandled error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      {
        ok: false,
        error: message,
        code: "INTERNAL_ERROR",
        request_id: requestId,
      },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
