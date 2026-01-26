import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/govcon/contracts
 *
 * List all contracts for the current user/org
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

    const { data: contracts, error } = await supabase
      .from("govcon_contracts")
      .select("*")
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) {
      // Table might not exist yet - return empty
      console.error("[GovCon Contracts] Fetch error:", error.message);
      return NextResponse.json(
        { contracts: [], request_id: requestId },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    return NextResponse.json(
      { contracts: contracts || [], request_id: requestId },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[GovCon Contracts] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}

/**
 * POST /api/govcon/contracts
 *
 * Create a new contract
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
      contract_number,
      contract_name,
      agency,
      contract_type,
      start_date,
      end_date,
      total_value,
      status,
    } = body as {
      contract_number?: string;
      contract_name?: string;
      agency?: string;
      contract_type?: string;
      start_date?: string;
      end_date?: string;
      total_value?: number;
      status?: string;
    };

    if (!contract_number || !contract_name) {
      return NextResponse.json(
        {
          error: "contract_number and contract_name are required",
          request_id: requestId,
        },
        { status: 400, headers: { "x-request-id": requestId } },
      );
    }

    const supabase = supabaseAdmin();
    const now = new Date().toISOString();

    const { data: contract, error } = await supabase
      .from("govcon_contracts")
      .insert({
        user_id: userId,
        clerk_user_id: userId,
        contract_number,
        contract_name,
        agency: agency || null,
        contract_type: contract_type || null,
        start_date: start_date || null,
        end_date: end_date || null,
        total_value: total_value || null,
        status: status || "active",
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error("[GovCon Contracts] Create error:", error.message);
      return NextResponse.json(
        { error: "Failed to create contract", request_id: requestId },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    return NextResponse.json(
      { contract, request_id: requestId },
      { status: 201, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[GovCon Contracts] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}

/**
 * PUT /api/govcon/contracts
 *
 * Update a contract
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
        { error: "Contract id is required", request_id: requestId },
        { status: 400, headers: { "x-request-id": requestId } },
      );
    }

    const supabase = supabaseAdmin();

    const { data: contract, error } = await supabase
      .from("govcon_contracts")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`)
      .select()
      .single();

    if (error) {
      console.error("[GovCon Contracts] Update error:", error.message);
      return NextResponse.json(
        { error: "Failed to update contract", request_id: requestId },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    return NextResponse.json(
      { contract, request_id: requestId },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[GovCon Contracts] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}

/**
 * DELETE /api/govcon/contracts
 *
 * Delete a contract
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
        { error: "Contract id is required", request_id: requestId },
        { status: 400, headers: { "x-request-id": requestId } },
      );
    }

    const supabase = supabaseAdmin();

    const { error } = await supabase
      .from("govcon_contracts")
      .delete()
      .eq("id", id)
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`);

    if (error) {
      console.error("[GovCon Contracts] Delete error:", error.message);
      return NextResponse.json(
        { error: "Failed to delete contract", request_id: requestId },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    return NextResponse.json(
      { ok: true, request_id: requestId },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[GovCon Contracts] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
