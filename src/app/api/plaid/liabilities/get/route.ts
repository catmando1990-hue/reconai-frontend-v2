import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getBackendUrl } from "@/lib/config";

/**
 * POST /api/plaid/liabilities/get
 *
 * Proxies to backend POST /api/plaid/liabilities/get
 * Returns liabilities data grouped by type.
 *
 * Phase 8C: Liabilities & Investments UI
 * - Manual fetch only (no polling)
 * - Returns request_id for audit provenance
 * - All balances are "reported balance" as of fetch time
 */
export async function POST() {
  const requestId = crypto.randomUUID();

  try {
    const { userId, getToken } = await auth();

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }

    const token = await getToken();

    let backendUrl: string;
    try {
      backendUrl = getBackendUrl();
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: "Backend not configured",
          liabilities: null,
          request_id: requestId,
        },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    const res = await fetch(`${backendUrl}/api/plaid/liabilities/get`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-request-id": requestId,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "Unknown error");
      console.error(
        `[Plaid liabilities] Backend error (${res.status}):`,
        errorText,
      );

      let errorMsg = `Failed to fetch liabilities: ${res.status}`;
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
          liabilities: null,
          request_id: requestId,
        },
        { status: res.status, headers: { "x-request-id": requestId } },
      );
    }

    const data = await res.json();

    // Unwrap backend response envelope if present
    const backendData = data.data || data;
    const liabilities = backendData.liabilities || backendData;

    // Normalize liabilities structure
    const normalized = {
      credit: normalizeCreditCards(liabilities.credit || []),
      student: normalizeStudentLoans(liabilities.student || []),
      mortgage: normalizeMortgages(liabilities.mortgage || []),
      other: normalizeOtherLoans(liabilities),
      fetched_at: new Date().toISOString(),
    };

    return NextResponse.json(
      {
        ok: true,
        liabilities: normalized,
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (err) {
    console.error("[Plaid liabilities] Unhandled error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";

    return NextResponse.json(
      {
        ok: false,
        error: `Failed to fetch liabilities: ${message}`,
        liabilities: null,
        request_id: requestId,
      },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}

function normalizeCreditCards(cards: Array<Record<string, unknown>>) {
  return cards.map((card) => {
    const aprs = card.aprs as Array<Record<string, unknown>> | undefined;
    return {
      account_id: card.account_id,
      institution_name: card.institution_name || "Unknown",
      account_name: card.name || card.official_name || "Credit Card",
      account_mask: card.mask || "****",
      reported_balance: Number(card.last_statement_balance ?? card.balance ?? 0),
      minimum_payment: card.minimum_payment_amount ?? null,
      apr: aprs?.[0]?.apr_percentage ?? null,
      as_of: card.last_statement_issue_date || card.as_of || null,
    };
  });
}

function normalizeStudentLoans(loans: Array<Record<string, unknown>>) {
  return loans.map((loan) => ({
    account_id: loan.account_id,
    institution_name: loan.institution_name || loan.servicer_name || "Unknown",
    account_name: loan.name || loan.official_name || "Student Loan",
    account_mask: loan.mask || "****",
    reported_balance: Number(loan.outstanding_interest_amount ?? 0) + Number(loan.current_balance ?? loan.balance ?? 0),
    interest_rate: loan.interest_rate_percentage ?? null,
    origination_date: loan.origination_date || null,
    as_of: loan.last_payment_date || loan.as_of || null,
  }));
}

function normalizeMortgages(mortgages: Array<Record<string, unknown>>) {
  return mortgages.map((mortgage) => {
    const interestRate = mortgage.interest_rate;
    const propertyAddress = mortgage.property_address as Record<string, unknown> | undefined;

    let rateValue: number | null = null;
    if (typeof interestRate === "number") {
      rateValue = interestRate;
    } else if (typeof interestRate === "object" && interestRate !== null) {
      const rateObj = interestRate as Record<string, unknown>;
      rateValue = typeof rateObj.percentage === "number" ? rateObj.percentage : null;
    }

    return {
      account_id: mortgage.account_id,
      institution_name: mortgage.institution_name || mortgage.servicer_name || "Unknown",
      account_name: mortgage.name || mortgage.official_name || "Mortgage",
      account_mask: mortgage.mask || "****",
      reported_balance: Number(mortgage.current_balance ?? mortgage.balance ?? 0),
      interest_rate: rateValue,
      property_address: propertyAddress ? String(propertyAddress.street || "") || null : null,
      as_of: mortgage.last_payment_date || mortgage.as_of || null,
    };
  });
}

function normalizeOtherLoans(liabilities: Record<string, unknown>) {
  // Collect any liability types not already handled
  const other: Array<Record<string, unknown>> = [];

  // Check for generic 'accounts' or other loan types
  const accounts = (liabilities.accounts || []) as Array<Record<string, unknown>>;
  for (const acct of accounts) {
    const type = String(acct.type || "").toLowerCase();
    if (!["credit", "student", "mortgage"].includes(type)) {
      other.push({
        account_id: acct.account_id,
        institution_name: acct.institution_name || "Unknown",
        account_name: acct.name || acct.official_name || "Loan",
        account_mask: acct.mask || "****",
        reported_balance: Number(acct.current_balance ?? acct.balance ?? 0),
        interest_rate: acct.interest_rate ?? null,
        loan_type: type || "other",
        as_of: acct.as_of || null,
      });
    }
  }

  return other;
}
