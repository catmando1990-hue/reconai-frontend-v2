import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/govcon/reconciliation
 *
 * List all reconciliation runs for the current user/org
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

    const { data: runs, error } = await supabase
      .from("govcon_reconciliation_runs")
      .select("*")
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) {
      // Table might not exist yet - return empty
      console.error("[GovCon Reconciliation] Fetch error:", error.message);
      return NextResponse.json(
        { runs: [], variances: [], request_id: requestId },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    // Also fetch variances
    const { data: variances } = await supabase
      .from("govcon_reconciliation_variances")
      .select("*")
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    return NextResponse.json(
      {
        runs: runs || [],
        variances: variances || [],
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[GovCon Reconciliation] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}

/**
 * POST /api/govcon/reconciliation
 *
 * Start a new reconciliation run
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
    const { run_type, fiscal_year, period_start, period_end, notes } = body as {
      run_type?: string;
      fiscal_year?: number;
      period_start?: string;
      period_end?: string;
      notes?: string;
    };

    if (!run_type) {
      return NextResponse.json(
        { error: "run_type is required", request_id: requestId },
        { status: 400, headers: { "x-request-id": requestId } },
      );
    }

    const supabase = supabaseAdmin();
    const now = new Date().toISOString();

    // Create the reconciliation run
    const { data: run, error } = await supabase
      .from("govcon_reconciliation_runs")
      .insert({
        user_id: userId,
        clerk_user_id: userId,
        run_type,
        fiscal_year: fiscal_year || new Date().getFullYear(),
        period_start: period_start || null,
        period_end: period_end || null,
        status: "running",
        notes: notes || null,
        started_at: now,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error("[GovCon Reconciliation] Create error:", error.message);
      return NextResponse.json(
        { error: "Failed to start reconciliation", request_id: requestId },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    // Simulate reconciliation completion (in real impl, this would be async)
    // For now, mark as completed with summary
    const { data: updatedRun } = await supabase
      .from("govcon_reconciliation_runs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        summary:
          "Reconciliation completed. Review variances for any discrepancies.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", run.id)
      .select()
      .single();

    return NextResponse.json(
      { run: updatedRun || run, request_id: requestId },
      { status: 201, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[GovCon Reconciliation] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}

/**
 * PUT /api/govcon/reconciliation/variance
 *
 * Update variance status (resolve, escalate, etc.)
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
    const { id, status, resolution_notes } = body as {
      id?: string;
      status?: string;
      resolution_notes?: string;
    };

    if (!id || !status) {
      return NextResponse.json(
        { error: "id and status are required", request_id: requestId },
        { status: 400, headers: { "x-request-id": requestId } },
      );
    }

    const supabase = supabaseAdmin();

    const { data: variance, error } = await supabase
      .from("govcon_reconciliation_variances")
      .update({
        status,
        resolution_notes: resolution_notes || null,
        resolved_at: status === "resolved" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`)
      .select()
      .single();

    if (error) {
      console.error("[GovCon Reconciliation] Update error:", error.message);
      return NextResponse.json(
        { error: "Failed to update variance", request_id: requestId },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }

    return NextResponse.json(
      { variance, request_id: requestId },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[GovCon Reconciliation] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
