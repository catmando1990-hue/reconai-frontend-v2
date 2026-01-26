import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * GET /api/reports/data-integrity
 *
 * Data Integrity Report
 * - Source lineage and trust verification
 * - Checks data completeness and consistency
 * - Identifies potential issues
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

    // Get Plaid items (bank connections)
    const { data: plaidItems, error: itemsError } = await supabase
      .from("plaid_items")
      .select("id, item_id, institution_name, created_at, status")
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`);

    if (itemsError) {
      console.error("[DataIntegrity] Items error:", itemsError);
    }

    // Get accounts
    const { data: accounts, error: accountsError } = await supabase
      .from("plaid_accounts")
      .select("id, account_id, name, item_id, created_at")
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`);

    if (accountsError) {
      console.error("[DataIntegrity] Accounts error:", accountsError);
    }

    // Get transactions with date range
    const { data: transactions, error: txError } = await supabase
      .from("plaid_transactions")
      .select("id, date, account_id, pending")
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`);

    if (txError) {
      console.error("[DataIntegrity] Transactions error:", txError);
    }

    // Get uploaded statements
    const { data: statements, error: stmtError } = await supabase
      .from("statements")
      .select("id, file_name, upload_date, statement_date")
      .or(`user_id.eq.${userId},clerk_user_id.eq.${userId}`);

    if (stmtError) {
      console.error("[DataIntegrity] Statements error:", stmtError);
    }

    // Build sources list
    const sources: Array<{
      id: string;
      name: string;
      type: "plaid" | "upload" | "manual";
      status: "verified" | "warning" | "error";
      last_sync: string | null;
      record_count: number;
      coverage_start: string | null;
      coverage_end: string | null;
      issues: string[];
    }> = [];

    // Add Plaid connections as sources
    for (const item of plaidItems || []) {
      const itemAccounts = (accounts || []).filter(
        (a) => a.item_id === item.item_id,
      );
      const itemAccountIds = itemAccounts.map((a) => a.account_id);
      const itemTxs = (transactions || []).filter((t) =>
        itemAccountIds.includes(t.account_id),
      );

      const issues: string[] = [];
      let status: "verified" | "warning" | "error" = "verified";

      // Check for stale data (no transactions in last 7 days)
      if (itemTxs.length > 0) {
        const latestTx = itemTxs.reduce((latest, tx) =>
          new Date(tx.date) > new Date(latest.date) ? tx : latest,
        );
        const daysSinceLatest = Math.floor(
          (Date.now() - new Date(latestTx.date).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        if (daysSinceLatest > 7) {
          issues.push(
            `No new transactions in ${daysSinceLatest} days - sync may be needed`,
          );
          status = "warning";
        }
      }

      // Check item status
      if (item.status === "error" || item.status === "login_required") {
        issues.push(`Connection requires re-authentication`);
        status = "error";
      }

      // Check for pending transactions
      const pendingCount = itemTxs.filter((t) => t.pending).length;
      if (pendingCount > 10) {
        issues.push(
          `${pendingCount} pending transactions - may indicate sync issues`,
        );
        if (status !== "error") status = "warning";
      }

      // Calculate coverage
      const txDates = itemTxs.map((t) => t.date).sort();
      const coverageStart = txDates[0] || null;
      const coverageEnd = txDates[txDates.length - 1] || null;

      sources.push({
        id: item.id,
        name: item.institution_name || "Bank Connection",
        type: "plaid",
        status,
        last_sync: item.created_at, // Would need actual sync tracking
        record_count: itemTxs.length,
        coverage_start: coverageStart,
        coverage_end: coverageEnd,
        issues,
      });
    }

    // Add uploaded statements as sources
    if (statements && statements.length > 0) {
      const stmtDates = statements
        .map((s) => s.statement_date || s.upload_date)
        .filter(Boolean)
        .sort();

      sources.push({
        id: "uploads",
        name: "Uploaded Statements",
        type: "upload",
        status: "verified",
        last_sync:
          statements.reduce((latest, s) =>
            new Date(s.upload_date || 0) > new Date(latest.upload_date || 0)
              ? s
              : latest,
          ).upload_date || null,
        record_count: statements.length,
        coverage_start: stmtDates[0] || null,
        coverage_end: stmtDates[stmtDates.length - 1] || null,
        issues: [],
      });
    }

    // Calculate summary
    const verifiedCount = sources.filter((s) => s.status === "verified").length;
    const warningCount = sources.filter((s) => s.status === "warning").length;
    const errorCount = sources.filter((s) => s.status === "error").length;
    const totalRecords = sources.reduce((sum, s) => sum + s.record_count, 0);

    let overallStatus: "verified" | "warning" | "error" = "verified";
    if (errorCount > 0) overallStatus = "error";
    else if (warningCount > 0) overallStatus = "warning";

    return NextResponse.json(
      {
        sources,
        summary: {
          total_sources: sources.length,
          verified_count: verifiedCount,
          warning_count: warningCount,
          error_count: errorCount,
          total_records: totalRecords,
          overall_status: overallStatus,
          last_check: new Date().toISOString(),
        },
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[DataIntegrity] Error:", err);
    return NextResponse.json(
      { error: "Internal server error", request_id: requestId },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
