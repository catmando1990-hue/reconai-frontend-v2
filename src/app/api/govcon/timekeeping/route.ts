import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/govcon/timekeeping
 *
 * List time entries for current user within a date range
 */
export async function GET(req: NextRequest) {
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
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    const supabase = supabaseAdmin();

    let query = supabase
      .from("govcon_time_entries")
      .select("*, govcon_contracts(contract_number, contract_name)")
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`)
      .order("entry_date", { ascending: false });

    if (startDate) {
      query = query.gte("entry_date", startDate);
    }
    if (endDate) {
      query = query.lte("entry_date", endDate);
    }

    const { data: entries, error } = await query;

    if (error) {
      // Table might not exist yet - return empty
      console.error("[GovCon Timekeeping] Fetch error:", error.message);
      return NextResponse.json(
        { entries: [], request_id: requestId },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    return NextResponse.json(
      { entries: entries || [], request_id: requestId },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[GovCon Timekeeping] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}

/**
 * POST /api/govcon/timekeeping
 *
 * Create a new time entry
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
      contract_id,
      entry_date,
      hours,
      description,
      task_code,
      labor_category,
    } = body as {
      contract_id?: string;
      entry_date?: string;
      hours?: number;
      description?: string;
      task_code?: string;
      labor_category?: string;
    };

    if (!contract_id || !entry_date || hours === undefined) {
      return NextResponse.json(
        {
          error: "contract_id, entry_date, and hours are required",
          request_id: requestId,
        },
        { status: 400, headers: { "x-request-id": requestId } },
      );
    }

    // Validate hours (DCAA requires 15-minute increments)
    if (hours < 0 || hours > 24) {
      return NextResponse.json(
        { error: "Hours must be between 0 and 24", request_id: requestId },
        { status: 400, headers: { "x-request-id": requestId } },
      );
    }

    const roundedHours = Math.round(hours * 4) / 4; // Round to 15-min increments

    const supabase = supabaseAdmin();
    const now = new Date().toISOString();

    const { data: entry, error } = await supabase
      .from("govcon_time_entries")
      .insert({
        user_id: userId,
        clerk_user_id: userId,
        contract_id,
        entry_date,
        hours: roundedHours,
        description: description || null,
        task_code: task_code || null,
        labor_category: labor_category || null,
        status: "draft",
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error("[GovCon Timekeeping] Create error:", error.message);
      return NextResponse.json(
        { error: "Failed to create time entry", request_id: requestId },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    return NextResponse.json(
      { entry, request_id: requestId },
      { status: 201, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[GovCon Timekeeping] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}

/**
 * PUT /api/govcon/timekeeping
 *
 * Update a time entry (only if status is 'draft')
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
    const { id, ...updates } = body as { id?: string } & Record<string, unknown>;

    if (!id) {
      return NextResponse.json(
        { error: "Time entry id is required", request_id: requestId },
        { status: 400, headers: { "x-request-id": requestId } },
      );
    }

    const supabase = supabaseAdmin();

    // Check current status
    const { data: existing } = await supabase
      .from("govcon_time_entries")
      .select("status")
      .eq("id", id)
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`)
      .single();

    if (existing?.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft entries can be edited", request_id: requestId },
        { status: 400, headers: { "x-request-id": requestId } },
      );
    }

    // Round hours if provided
    if (typeof updates.hours === "number") {
      updates.hours = Math.round(updates.hours * 4) / 4;
    }

    const { data: entry, error } = await supabase
      .from("govcon_time_entries")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`)
      .select()
      .single();

    if (error) {
      console.error("[GovCon Timekeeping] Update error:", error.message);
      return NextResponse.json(
        { error: "Failed to update time entry", request_id: requestId },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    return NextResponse.json(
      { entry, request_id: requestId },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[GovCon Timekeeping] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}

/**
 * DELETE /api/govcon/timekeeping
 *
 * Delete a time entry (only if status is 'draft')
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
        { error: "Time entry id is required", request_id: requestId },
        { status: 400, headers: { "x-request-id": requestId } },
      );
    }

    const supabase = supabaseAdmin();

    // Check current status
    const { data: existing } = await supabase
      .from("govcon_time_entries")
      .select("status")
      .eq("id", id)
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`)
      .single();

    if (existing?.status !== "draft") {
      return NextResponse.json(
        { error: "Only draft entries can be deleted", request_id: requestId },
        { status: 400, headers: { "x-request-id": requestId } },
      );
    }

    const { error } = await supabase
      .from("govcon_time_entries")
      .delete()
      .eq("id", id)
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`);

    if (error) {
      console.error("[GovCon Timekeeping] Delete error:", error.message);
      return NextResponse.json(
        { error: "Failed to delete time entry", request_id: requestId },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    return NextResponse.json(
      { ok: true, request_id: requestId },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[GovCon Timekeeping] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
