import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/plaid/diagnostic
 *
 * Debug endpoint to diagnose item ownership issues.
 * Shows what the current user ID is and what items exist.
 */
export async function GET() {
  const requestId = crypto.randomUUID();

  try {
    const { userId } = await auth();

    const supabase = supabaseAdmin();

    // Get ALL items (unfiltered) to see what exists
    const { data: allItems, error: allError } = await supabase
      .from("plaid_items")
      .select(
        "id, item_id, institution_name, user_id, clerk_user_id, status, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(20);

    // Get items filtered by current user
    const { data: userItems, error: userError } = await supabase
      .from("plaid_items")
      .select("id, item_id, institution_name, user_id, clerk_user_id, status")
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`);

    return NextResponse.json({
      request_id: requestId,
      auth: {
        userId: userId,
        isAuthenticated: !!userId,
      },
      database: {
        allItemsCount: allItems?.length ?? 0,
        allItems:
          allItems?.map((item) => ({
            id: item.id,
            item_id: item.item_id,
            institution_name: item.institution_name,
            user_id: item.user_id,
            clerk_user_id: item.clerk_user_id,
            status: item.status,
            // Check if this user should match
            wouldMatch:
              item.user_id === userId || item.clerk_user_id === userId,
          })) ?? [],
        allItemsError: allError?.message,
        userItemsCount: userItems?.length ?? 0,
        userItems: userItems ?? [],
        userItemsError: userError?.message,
      },
      diagnosis: {
        problem:
          userItems?.length === 0 && (allItems?.length ?? 0) > 0
            ? "Items exist but user ID doesn't match"
            : userItems?.length === 0
              ? "No items in database"
              : "Items found for user",
        suggestion:
          userItems?.length === 0 && (allItems?.length ?? 0) > 0
            ? "The item was created with a different user_id/clerk_user_id. Need to update the ownership."
            : null,
      },
    });
  } catch (err) {
    console.error("[Plaid diagnostic] Error:", err);
    return NextResponse.json(
      {
        request_id: requestId,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
