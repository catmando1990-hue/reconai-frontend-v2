import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * PATCH /api/transactions/[id]/category
 *
 * Updates the category of a specific transaction.
 * User-scoped: Only the owner can update their transactions.
 *
 * Request body: { category: string }
 *
 * SECURITY:
 * - Authenticated users only
 * - User can only update their own transactions
 * - Category is validated as non-empty string
 */

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, context: Params) {
  const requestId = crypto.randomUUID();
  const { id: transactionId } = await context.params;

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }

    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID required", request_id: requestId },
        { status: 400, headers: { "x-request-id": requestId } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const { category } = body as { category?: string };

    if (!category || typeof category !== "string" || category.trim() === "") {
      return NextResponse.json(
        { error: "Category is required", request_id: requestId },
        { status: 400, headers: { "x-request-id": requestId } },
      );
    }

    const supabase = supabaseAdmin();

    // Verify transaction exists and belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from("transactions")
      .select("id, transaction_id, user_id, category")
      .eq("transaction_id", transactionId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "Transaction not found", request_id: requestId },
        { status: 404, headers: { "x-request-id": requestId } },
      );
    }

    // Security: Verify ownership
    if (existing.user_id !== userId) {
      return NextResponse.json(
        { error: "Not authorized to update this transaction", request_id: requestId },
        { status: 403, headers: { "x-request-id": requestId } },
      );
    }

    // Update category (stored as array in Plaid schema)
    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        category: [category.trim()],
        updated_at: new Date().toISOString(),
      })
      .eq("transaction_id", transactionId);

    if (updateError) {
      console.error("[Transaction category] Update error:", updateError.message);
      return NextResponse.json(
        { error: "Failed to update category", request_id: requestId },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        transaction_id: transactionId,
        category: category.trim(),
        previous_category: existing.category?.[0] || null,
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[Transaction category] Error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unknown error",
        request_id: requestId,
      },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
