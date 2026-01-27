import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/plaid/items
 *
 * Returns Plaid items from Supabase for the authenticated user.
 * Source of truth: Supabase `plaid_items` table.
 *
 * Optional query params:
 * - context: "personal" | "business" — filter by item context
 *   If omitted, returns all items (backwards-compatible).
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

    // Parse optional context filter from query params
    const { searchParams } = new URL(req.url);
    const contextParam = searchParams.get("context");
    const context =
      contextParam === "personal" || contextParam === "business"
        ? contextParam
        : null;

    // Query Supabase directly
    const supabase = supabaseAdmin();

    let query = supabase
      .from("plaid_items")
      .select(
        `
        id,
        item_id,
        institution_id,
        institution_name,
        status,
        context,
        created_at,
        updated_at
      `,
      )
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`);

    if (context) {
      query = query.eq("context", context);
    }

    const { data: items, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      console.error("[Plaid items] Supabase error:", error);
      return NextResponse.json(
        {
          ok: false,
          error: { code: "SUPABASE_ERROR", message: error.message },
          request_id: requestId,
        },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    // Empty state is valid — user hasn't connected bank yet
    if (!items || items.length === 0) {
      return NextResponse.json(
        {
          ok: true,
          items: [],
          status: "not_connected",
          message: "No bank connected yet",
          request_id: requestId,
        },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    // Map to expected response shape
    const mappedItems = items.map((item) => ({
      item_id: item.item_id,
      institution_id: item.institution_id,
      institution_name: item.institution_name,
      status: item.status || "active",
      created_at: item.created_at,
      updated_at: item.updated_at,
    }));

    return NextResponse.json(
      {
        ok: true,
        items: mappedItems,
        status: "connected",
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[Plaid items] Unhandled error:", err);
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
