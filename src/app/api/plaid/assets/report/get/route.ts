import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getBackendUrl } from "@/lib/config";

/**
 * POST /api/plaid/assets/report/get
 *
 * Proxies to backend POST /api/plaid/assets/report/get
 * Retrieves an existing Asset Report (Net Worth Snapshot).
 *
 * Request body:
 * - report_id: The Plaid asset report ID (optional - if omitted, returns list of all reports)
 *
 * Phase 8B: Net Worth Snapshot UI
 * - Manual fetch only (no polling)
 * - Returns request_id for audit provenance
 * - All balances are historical "as of" snapshots, NOT live data
 */
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const { userId, getToken } = await auth();

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }

    const body = await request.json().catch(() => ({}));
    const reportId = body.report_id;

    const token = await getToken();

    let backendUrl: string;
    try {
      backendUrl = getBackendUrl();
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: "Backend not configured",
          reports: [],
          request_id: requestId,
        },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    const res = await fetch(`${backendUrl}/api/plaid/assets/report/get`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-request-id": requestId,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(reportId ? { report_id: reportId } : {}),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      console.error(
        `[Asset report get] Backend error (${res.status}):`,
        errorText,
      );

      let errorMsg = `Failed to fetch snapshots: ${res.status}`;
      try {
        const errData = JSON.parse(errorText);
        errorMsg = errData.error || errData.detail || errorMsg;
      } catch {
        // Keep default error message
      }

      return NextResponse.json(
        {
          ok: false,
          error: errorMsg,
          reports: [],
          request_id: requestId,
        },
        { status: res.status, headers: { "x-request-id": requestId } },
      );
    }

    const data = await res.json();

    // Unwrap backend response envelope if present
    const backendData = data.data || data;

    // Normalize response - could be single report or list
    let reports = [];
    if (backendData.reports) {
      reports = backendData.reports;
    } else if (backendData.report) {
      reports = [backendData.report];
    } else if (backendData.asset_report_id || backendData.report_id) {
      // Single report returned directly
      reports = [backendData];
    } else if (Array.isArray(backendData)) {
      reports = backendData;
    }

    // Map to consistent shape
    const normalizedReports = reports.map(
      (report: Record<string, unknown>) => ({
        report_id: report.asset_report_id || report.report_id || report.id,
        generated_at:
          report.generated_at || report.created_at || report.date_generated,
        // Calculate total assets from accounts if available
        total_assets: calculateTotalAssets(report),
        accounts: normalizeAccounts(report),
      }),
    );

    return NextResponse.json(
      {
        ok: true,
        reports: normalizedReports,
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[Asset report get] Unhandled error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";

    return NextResponse.json(
      {
        ok: false,
        error: `Failed to fetch snapshots: ${message}`,
        reports: [],
        request_id: requestId,
      },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}

/**
 * Calculate total assets from report accounts.
 * Uses balance_as_of snapshot value, NOT live balance.
 */
function calculateTotalAssets(report: Record<string, unknown>): number {
  const items = (report.items || report.accounts || []) as Array<
    Record<string, unknown>
  >;
  let total = 0;

  for (const item of items) {
    const accounts = (item.accounts || [item]) as Array<
      Record<string, unknown>
    >;
    for (const account of accounts) {
      const balances = account.balances as Record<string, unknown> | undefined;
      // Use historical snapshot balance, NOT current
      const balance =
        balances?.available ?? balances?.current ?? account.balance ?? 0;
      total += Number(balance) || 0;
    }
  }

  return total;
}

/**
 * Normalize accounts from various Plaid response shapes.
 * All balances represent historical snapshots "as of" generation time.
 */
function normalizeAccounts(report: Record<string, unknown>): Array<{
  institution_name: string;
  institution_id: string;
  account_name: string;
  account_mask: string;
  account_type: string;
  balance_as_of: number;
}> {
  const accounts: Array<{
    institution_name: string;
    institution_id: string;
    account_name: string;
    account_mask: string;
    account_type: string;
    balance_as_of: number;
  }> = [];

  const items = (report.items || []) as Array<Record<string, unknown>>;

  for (const item of items) {
    const institution = item.institution as Record<string, unknown> | undefined;
    const institutionName = (item.institution_name ||
      institution?.name ||
      "Unknown") as string;
    const institutionId = (item.institution_id ||
      institution?.institution_id ||
      "") as string;
    const itemAccounts = (item.accounts || []) as Array<
      Record<string, unknown>
    >;

    for (const acct of itemAccounts) {
      const balances = acct.balances as Record<string, unknown> | undefined;
      accounts.push({
        institution_name: institutionName,
        institution_id: institutionId,
        account_name: (acct.name || acct.official_name || "Account") as string,
        account_mask: (acct.mask || "****") as string,
        account_type: (acct.type || acct.subtype || "depository") as string,
        // Historical snapshot balance - NOT live
        balance_as_of: Number(
          balances?.available ?? balances?.current ?? acct.balance ?? 0,
        ),
      });
    }
  }

  // If no items structure, try flat accounts array
  if (accounts.length === 0 && report.accounts) {
    const flatAccounts = report.accounts as Array<Record<string, unknown>>;
    for (const acct of flatAccounts) {
      const balances = acct.balances as Record<string, unknown> | undefined;
      accounts.push({
        institution_name: (acct.institution_name || "Unknown") as string,
        institution_id: (acct.institution_id || "") as string,
        account_name: (acct.name || acct.official_name || "Account") as string,
        account_mask: (acct.mask || "****") as string,
        account_type: (acct.type || acct.subtype || "depository") as string,
        balance_as_of: Number(
          balances?.available ?? balances?.current ?? acct.balance ?? 0,
        ),
      });
    }
  }

  return accounts;
}
