import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import type { IntelligenceSignal } from "@/lib/intelligence-types";

/**
 * GovCon Intelligence API
 *
 * STRICT ISOLATION: This API MUST NOT import or reference
 * any non-GovCon intelligence code.
 *
 * Returns AI-generated signals for GovCon module:
 * - DCAA readiness signals
 * - Timekeeping anomalies
 * - Indirect rate drift
 * - Unallowable cost flags
 * - Audit trail integrity warnings
 */

const DEMO_GOVCON_SIGNALS: IntelligenceSignal[] = [
  {
    id: "govcon-1",
    title: "DCAA Readiness: Missing Timekeeping Approvals",
    description:
      "14 timesheet entries from the past 2 weeks are pending supervisor approval. DCAA requires timely approval of all labor charges.",
    confidence: 0.96,
    severity: "high",
    category: "DCAA Readiness",
    created_at: new Date().toISOString(),
    actionable: true,
    evidence: {
      pending_approvals: 14,
      affected_contracts: ["FA8620-21-C-0001", "W912HZ-20-C-0045"],
      oldest_entry_days: 12,
    },
    advisory_disclaimer:
      "DCAA requires contemporaneous timekeeping with timely supervisory approval. Address pending approvals immediately.",
  },
  {
    id: "govcon-2",
    title: "Indirect Rate Drift: Fringe Pool",
    description:
      "Fringe benefit rate is tracking 8% above the provisional rate. This may require rate adjustment or explanation to the contracting officer.",
    confidence: 0.91,
    severity: "medium",
    category: "Indirect Rate Drift",
    created_at: new Date().toISOString(),
    actionable: true,
    evidence: {
      rate_type: "Fringe",
      provisional_rate: 0.32,
      actual_rate: 0.346,
      variance_pct: 8,
    },
    advisory_disclaimer:
      "Rate variances may be acceptable if within provisional rate ceiling. Consult with your DCAA auditor or contracts team.",
  },
  {
    id: "govcon-3",
    title: "Potential Unallowable Cost: Entertainment",
    description:
      '3 transactions categorized under "Entertainment" may be unallowable per FAR 31.205-14. Review and reclassify if necessary.',
    confidence: 0.89,
    severity: "high",
    category: "Unallowable Cost",
    created_at: new Date().toISOString(),
    actionable: true,
    evidence: {
      transaction_count: 3,
      total_amount: 450,
      far_reference: "FAR 31.205-14",
    },
    advisory_disclaimer:
      "Entertainment costs are generally unallowable. Some costs may be allowable as employee morale under specific circumstances. Review FAR 31.205-14 guidance.",
  },
  {
    id: "govcon-4",
    title: "Audit Trail Integrity: Hash Chain Verification",
    description:
      "All audit trail entries have valid hash chain integrity. No tampering detected in the past 30 days.",
    confidence: 0.99,
    severity: "low",
    category: "Audit Trail Integrity",
    created_at: new Date().toISOString(),
    actionable: false,
    evidence: {
      entries_verified: 1247,
      period_days: 30,
      integrity_status: "VALID",
    },
    advisory_disclaimer:
      "This is an informational signal. Continue to monitor audit trail integrity regularly.",
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
      items: DEMO_GOVCON_SIGNALS,
      request_id: requestId,
      _demo: true,
      _org_id: orgId,
      _govcon_isolated: true, // Explicit isolation marker
    },
    { headers: { "x-request-id": requestId } },
  );
}
