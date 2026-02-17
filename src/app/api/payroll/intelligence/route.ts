import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import type { IntelligenceSignal } from "@/lib/intelligence-types";

/**
 * Payroll Intelligence API
 *
 * Returns AI-generated signals for Payroll module:
 * - Payroll variance anomalies
 * - Overtime spikes
 * - Tax withholding risk warnings
 * - Employee pay outlier detection
 */

const DEMO_PAYROLL_SIGNALS: IntelligenceSignal[] = [
  {
    id: "payroll-1",
    title: "Overtime Spike: Engineering Department",
    description:
      "Engineering department overtime hours increased 45% this pay period compared to 6-month average. 3 employees exceed 20 OT hours.",
    confidence: 0.93,
    severity: "medium",
    category: "Overtime Spike",
    created_at: new Date().toISOString(),
    actionable: true,
    evidence: {
      department: "Engineering",
      current_ot_hours: 127,
      avg_ot_hours: 88,
      increase_pct: 45,
      high_ot_employees: 3,
    },
    advisory_disclaimer:
      "Overtime spikes may be justified by project deadlines or seasonal work. Verify with department managers.",
  },
  {
    id: "payroll-2",
    title: "Tax Withholding Variance",
    description:
      "2 employees have federal withholding amounts that differ significantly from expected based on W-4 elections.",
    confidence: 0.88,
    severity: "high",
    category: "Tax Withholding",
    created_at: new Date().toISOString(),
    actionable: true,
    evidence: {
      affected_employees: 2,
      variance_type: "Under-withholding",
      potential_exposure: 1200,
    },
    advisory_disclaimer:
      "Tax withholding calculations should be verified by payroll specialists. Employee W-4 changes may not be reflected immediately.",
  },
  {
    id: "payroll-3",
    title: "Compensation Outlier Detected",
    description:
      "1 employee salary is more than 2 standard deviations above department median for their role and tenure.",
    confidence: 0.86,
    severity: "low",
    category: "Compensation Outlier",
    created_at: new Date().toISOString(),
    actionable: false,
    evidence: {
      role: "Senior Developer",
      department: "Engineering",
      deviation_factor: 2.3,
    },
    advisory_disclaimer:
      "Compensation outliers may reflect specialized skills, retention bonuses, or equity adjustments. Not necessarily indicative of an issue.",
  },
];

export async function GET(request: Request) {
  const { userId, orgId } = await auth();
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized", request_id: requestId },
      { status: 401, headers: { "x-request-id": requestId } },
    );
  }

  return NextResponse.json(
    {
      lifecycle: "success",
      generated_at: new Date().toISOString(),
      items: DEMO_PAYROLL_SIGNALS,
      request_id: requestId,
      _demo: true,
      _org_id: orgId,
    },
    { headers: { "x-request-id": requestId } },
  );
}
