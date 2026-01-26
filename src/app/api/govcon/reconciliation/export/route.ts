import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * POST /api/govcon/reconciliation/export
 *
 * Export ICS (Incurred Cost Submission) data as CSV
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
    const { fiscal_year, schedules } = body as {
      fiscal_year?: number;
      schedules?: string[];
    };

    const fy = fiscal_year || new Date().getFullYear();
    const supabase = supabaseAdmin();

    // Fetch contracts
    const { data: contracts } = await supabase
      .from("govcon_contracts")
      .select("*")
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`);

    // Fetch indirect pools
    const { data: pools } = await supabase
      .from("govcon_indirect_pools")
      .select("*")
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`)
      .eq("fiscal_year", fy);

    // Fetch time entries
    const { data: timeEntries } = await supabase
      .from("govcon_time_entries")
      .select("*")
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`);

    // Build CSV content
    const lines: string[] = [];
    const now = new Date().toISOString();

    // Header
    lines.push(`ICS Export - Fiscal Year ${fy}`);
    lines.push(`Generated: ${now}`);
    lines.push(`Request ID: ${requestId}`);
    lines.push("");

    // Schedule H - Contract Brief
    if (!schedules || schedules.includes("H")) {
      lines.push("--- Schedule H: Contract Brief ---");
      lines.push("Contract Number,Contract Name,Agency,Type,Total Value,Status");
      for (const c of contracts || []) {
        lines.push(
          `"${c.contract_number}","${c.contract_name}","${c.agency || ""}","${c.contract_type || ""}","${c.total_value || 0}","${c.status}"`
        );
      }
      lines.push("");
    }

    // Schedule K - Summary of Hours and Amounts
    if (!schedules || schedules.includes("K")) {
      lines.push("--- Schedule K: Summary of Hours and Amounts ---");
      lines.push("Contract ID,Date,Hours,Description,Task Code,Labor Category,Status");
      for (const t of timeEntries || []) {
        lines.push(
          `"${t.contract_id}","${t.entry_date}","${t.hours}","${t.description || ""}","${t.task_code || ""}","${t.labor_category || ""}","${t.status}"`
        );
      }
      lines.push("");
    }

    // Schedule M - Indirect Cost Pools
    if (!schedules || schedules.includes("M")) {
      lines.push("--- Schedule M: Indirect Cost Pools ---");
      lines.push("Pool Name,Pool Type,Base Type,Rate %,FAR Reference,Allowability,Fiscal Year");
      for (const p of pools || []) {
        lines.push(
          `"${p.pool_name}","${p.pool_type}","${p.base_type || ""}","${p.rate_percentage || ""}","${p.far_reference || ""}","${p.allowability_status}","${p.fiscal_year}"`
        );
      }
      lines.push("");
    }

    const csvContent = lines.join("\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="ICS_FY${fy}_${Date.now()}.csv"`,
        "x-request-id": requestId,
      },
    });
  } catch (err) {
    console.error("[GovCon ICS Export] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
