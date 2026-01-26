import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/govcon/indirects
 *
 * List all indirect cost pools for the current user/org
 */
export async function GET() {
  const requestId = crypto.randomUUID();

  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }

    const supabase = supabaseAdmin();

    const { data: pools, error } = await supabase
      .from("govcon_indirect_pools")
      .select("*")
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) {
      // Table might not exist yet - return empty
      console.error("[GovCon Indirects] Fetch error:", error.message);
      return NextResponse.json(
        { pools: [], request_id: requestId },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    return NextResponse.json(
      { pools: pools || [], request_id: requestId },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[GovCon Indirects] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}

/**
 * POST /api/govcon/indirects
 *
 * Create a new indirect cost pool
 */
export async function POST(req: NextRequest) {
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
    const {
      pool_name,
      pool_type,
      base_type,
      rate_percentage,
      far_reference,
      allowability_status,
      fiscal_year,
      description,
    } = body as {
      pool_name?: string;
      pool_type?: string;
      base_type?: string;
      rate_percentage?: number;
      far_reference?: string;
      allowability_status?: string;
      fiscal_year?: number;
      description?: string;
    };

    if (!pool_name || !pool_type) {
      return NextResponse.json(
        {
          error: "pool_name and pool_type are required",
          request_id: requestId,
        },
        { status: 400, headers: { "x-request-id": requestId } },
      );
    }

    const supabase = supabaseAdmin();
    const now = new Date().toISOString();

    const { data: pool, error } = await supabase
      .from("govcon_indirect_pools")
      .insert({
        user_id: userId,
        clerk_user_id: userId,
        pool_name,
        pool_type,
        base_type: base_type || null,
        rate_percentage: rate_percentage || null,
        far_reference: far_reference || null,
        allowability_status: allowability_status || "pending_review",
        fiscal_year: fiscal_year || new Date().getFullYear(),
        description: description || null,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error("[GovCon Indirects] Create error:", error.message);
      return NextResponse.json(
        { error: "Failed to create indirect pool", request_id: requestId },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    return NextResponse.json(
      { pool, request_id: requestId },
      { status: 201, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[GovCon Indirects] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}

/**
 * PUT /api/govcon/indirects
 *
 * Update an indirect cost pool
 */
export async function PUT(req: NextRequest) {
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
    const { id, ...updates } = body as { id?: string } & Record<
      string,
      unknown
    >;

    if (!id) {
      return NextResponse.json(
        { error: "Pool id is required", request_id: requestId },
        { status: 400, headers: { "x-request-id": requestId } },
      );
    }

    const supabase = supabaseAdmin();

    const { data: pool, error } = await supabase
      .from("govcon_indirect_pools")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`)
      .select()
      .single();

    if (error) {
      console.error("[GovCon Indirects] Update error:", error.message);
      return NextResponse.json(
        { error: "Failed to update indirect pool", request_id: requestId },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    return NextResponse.json(
      { pool, request_id: requestId },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[GovCon Indirects] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}

/**
 * DELETE /api/govcon/indirects
 *
 * Delete an indirect cost pool
 */
export async function DELETE(req: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Pool id is required", request_id: requestId },
        { status: 400, headers: { "x-request-id": requestId } },
      );
    }

    const supabase = supabaseAdmin();

    const { error } = await supabase
      .from("govcon_indirect_pools")
      .delete()
      .eq("id", id)
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`);

    if (error) {
      console.error("[GovCon Indirects] Delete error:", error.message);
      return NextResponse.json(
        { error: "Failed to delete indirect pool", request_id: requestId },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    return NextResponse.json(
      { ok: true, request_id: requestId },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[GovCon Indirects] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
