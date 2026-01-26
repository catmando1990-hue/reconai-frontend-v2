import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/**
 * STEP 8: Stripe Checkout Session Creator
 *
 * Creates a Stripe Checkout session for tier upgrades.
 * - Dashboard-only (authenticated routes)
 * - Price IDs allowlisted via environment variables
 * - No Stripe JS on public routes
 * - Enterprise is contract-only (not available via Stripe)
 */

// Valid tier keys
const VALID_TIERS = ["starter", "pro", "govcon"] as const;
const VALID_INTERVALS = ["monthly", "yearly"] as const;

type TierKey = (typeof VALID_TIERS)[number];
type IntervalKey = (typeof VALID_INTERVALS)[number];

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://reconai-backend.onrender.com";

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();

  try {
    const { userId, getToken } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", request_id: requestId },
        { status: 401, headers: { "x-request-id": requestId } },
      );
    }

    const body = await req.json();
    const { tier } = body;

    // Validate tier format: "starter_monthly", "pro_yearly", etc.
    if (!tier || typeof tier !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid tier parameter", request_id: requestId },
        { status: 400, headers: { "x-request-id": requestId } },
      );
    }

    // Parse tier_interval format (e.g., "starter_monthly" → tier: "starter", interval: "monthly")
    const parts = tier.split("_");
    if (parts.length !== 2) {
      return NextResponse.json(
        {
          error:
            "Invalid tier format. Expected: tier_interval (e.g., starter_monthly)",
          request_id: requestId,
        },
        { status: 400, headers: { "x-request-id": requestId } },
      );
    }

    const [tierName, interval] = parts as [string, string];

    // Validate tier name
    if (!VALID_TIERS.includes(tierName as TierKey)) {
      return NextResponse.json(
        {
          error: "Invalid tier. Enterprise plans require direct contact.",
          allowed_tiers: [...VALID_TIERS],
          request_id: requestId,
        },
        { status: 400, headers: { "x-request-id": requestId } },
      );
    }

    // Validate interval
    if (!VALID_INTERVALS.includes(interval as IntervalKey)) {
      return NextResponse.json(
        {
          error: "Invalid billing interval.",
          allowed_intervals: [...VALID_INTERVALS],
          request_id: requestId,
        },
        { status: 400, headers: { "x-request-id": requestId } },
      );
    }

    const token = await getToken();

    // Call backend to create Stripe checkout session
    // Backend expects: { tier: "starter", interval: "monthly" }
    const res = await fetch(`${API_URL}/api/billing/create-checkout-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        tier: tierName,
        interval: interval,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: errorData.detail || "Failed to create checkout session",
          request_id: requestId,
        },
        { status: res.status, headers: { "x-request-id": requestId } },
      );
    }

    const data = await res.json();
    return NextResponse.json(
      {
        checkout_url: data.checkout_url,
        session_id: data.session_id,
        request_id: requestId,
      },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (error) {
    console.error("Checkout session error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session", request_id: requestId },
      { status: 500, headers: { "x-request-id": requestId } },
    );
  }
}
