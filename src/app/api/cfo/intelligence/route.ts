import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import type { IntelligenceSignal } from "@/lib/intelligence-types";

/**
 * CFO Intelligence API
 *
 * Returns AI-generated signals for CFO module:
 * - Runway risk / burn anomalies
 * - Forecast deviation
 * - Cash flow volatility flags
 * - Receivables/payables risk
 */

const DEMO_CFO_SIGNALS: IntelligenceSignal[] = [
  {
    id: "cfo-1",
    title: "Runway Risk: 45 Days Below Target",
    description:
      "Current cash runway of 67 days is below the 90-day target threshold. Burn rate has increased 15% month-over-month.",
    confidence: 0.94,
    severity: "high",
    category: "Runway Risk",
    created_at: new Date().toISOString(),
    actionable: true,
    evidence: {
      current_runway_days: 67,
      target_runway_days: 90,
      burn_rate_monthly: 42000,
      burn_rate_change_pct: 15,
    },
    advisory_disclaimer:
      "Runway calculations are based on current burn rate and may not reflect planned revenue or cost changes.",
  },
  {
    id: "cfo-2",
    title: "Forecast Deviation: Q1 Revenue",
    description:
      "Actual Q1 revenue is tracking 12% below forecast. Primary variance is in recurring subscription revenue.",
    confidence: 0.89,
    severity: "medium",
    category: "Forecast Deviation",
    created_at: new Date().toISOString(),
    actionable: true,
    evidence: {
      forecast_q1: 180000,
      actual_q1: 158400,
      variance_pct: -12,
      primary_driver: "Recurring Revenue",
    },
    advisory_disclaimer:
      "Forecast deviations may be affected by timing differences or one-time events not yet recorded.",
  },
  {
    id: "cfo-3",
    title: "Receivables Risk: Aging Concentration",
    description:
      "42% of outstanding receivables are over 60 days old. Top 3 accounts represent 68% of aged balance.",
    confidence: 0.91,
    severity: "medium",
    category: "Receivables Risk",
    created_at: new Date().toISOString(),
    actionable: true,
    evidence: {
      total_ar: 125000,
      over_60_days: 52500,
      over_60_days_pct: 42,
      top_accounts: ["Acme Corp", "Initech", "Globex"],
    },
    advisory_disclaimer:
      "Some aged receivables may have payment terms or disputes not reflected in this analysis.",
  },
];

export async function GET() {
  const { userId, orgId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    lifecycle: "success",
    generated_at: new Date().toISOString(),
    items: DEMO_CFO_SIGNALS,
    _demo: true,
    _org_id: orgId,
  });
}
