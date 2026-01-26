import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/intelligence/rules
 * Returns user's category rules (merchant → category mappings)
 *
 * POST /api/intelligence/rules
 * Creates or updates a category rule
 * Body: { merchant_pattern: string, category: string }
 *
 * SECURITY:
 * - User-scoped queries only
 * - Fail-closed on errors
 */

export async function GET() {
  const requestId = crypto.randomUUID();

  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { rules: [], request_id: requestId },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    const supabase = supabaseAdmin();
    const { data: rules, error } = await supabase
      .from("category_rules")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      // Table might not exist yet - return empty
      console.error("[Category rules] Fetch error:", error.message);
      return NextResponse.json(
        { rules: [], request_id: requestId },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    return NextResponse.json(
      { rules: rules || [], request_id: requestId },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[Category rules] Error:", err);
    return NextResponse.json(
      { rules: [], request_id: requestId },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  }
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
    const { merchant_pattern, category } = body as {
      merchant_pattern?: string;
      category?: string;
    };

    if (!merchant_pattern || !category) {
      return NextResponse.json(
        {
          error: "merchant_pattern and category required",
          request_id: requestId,
        },
        { status: 400, headers: { "x-request-id": requestId } },
      );
    }

    const supabase = supabaseAdmin();
    const now = new Date().toISOString();

    // Check if rule exists for this merchant
    const { data: existing } = await supabase
      .from("category_rules")
      .select("id")
      .eq("user_id", userId)
      .eq("merchant_pattern", merchant_pattern.toLowerCase().trim())
      .single();

    if (existing) {
      // Update existing rule
      const { error: updateError } = await supabase
        .from("category_rules")
        .update({ category: category.trim(), updated_at: now })
        .eq("id", existing.id);

      if (updateError) {
        console.error("[Category rules] Update error:", updateError.message);
        return NextResponse.json(
          { error: "Failed to update rule", request_id: requestId },
          { status: 500, headers: { "x-request-id": requestId } },
        );
      }

      return NextResponse.json(
        {
          ok: true,
          action: "updated",
          merchant_pattern: merchant_pattern.toLowerCase().trim(),
          category: category.trim(),
          request_id: requestId,
        },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    // Create new rule
    const { error: insertError } = await supabase
      .from("category_rules")
      .insert({
        user_id: userId,
        merchant_pattern: merchant_pattern.toLowerCase().trim(),
        category: category.trim(),
        created_at: now,
        updated_at: now,
      });

    if (insertError) {
      console.error("[Category rules] Insert error:", insertError.message);
      return NextResponse.json(
        { error: "Failed to create rule", request_id: requestId },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        action: "created",
        merchant_pattern: merchant_pattern.toLowerCase().trim(),
        category: category.trim(),
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[Category rules] Error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unknown error",
        request_id: requestId,
      },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
