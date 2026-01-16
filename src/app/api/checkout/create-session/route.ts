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

// Allowlisted price IDs from environment
const ALLOWED_PRICES: Record<string, string | undefined> = {
  starter_monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY,
  starter_yearly: process.env.STRIPE_PRICE_STARTER_YEARLY,
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
  pro_yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
  govcon_monthly: process.env.STRIPE_PRICE_GOVCON_MONTHLY,
  govcon_yearly: process.env.STRIPE_PRICE_GOVCON_YEARLY,
};

// Tier display names for validation
const TIER_NAMES: Record<string, string> = {
  starter_monthly: "Starter (Monthly)",
  starter_yearly: "Starter (Annual)",
  pro_monthly: "Pro (Monthly)",
  pro_yearly: "Pro (Annual)",
  govcon_monthly: "GovCon (Monthly)",
  govcon_yearly: "GovCon (Annual)",
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "https://reconai-backend.onrender.com";

export async function POST(req: Request) {
  try {
    const { userId, getToken } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { tier } = body;

    // Validate tier
    if (!tier || typeof tier !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid tier parameter" },
        { status: 400 },
      );
    }

    // Check if tier is allowed
    const priceId = ALLOWED_PRICES[tier];
    if (!priceId) {
      return NextResponse.json(
        {
          error: "Invalid tier. Enterprise plans require direct contact.",
          allowed_tiers: Object.keys(TIER_NAMES),
        },
        { status: 400 },
      );
    }

    const token = await getToken();

    // Call backend to create Stripe checkout session
    const res = await fetch(`${API_URL}/api/billing/create-checkout-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        price_id: priceId,
        tier_key: tier,
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.reconai.dev"}/dashboard/settings?checkout=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.reconai.dev"}/dashboard/settings?checkout=cancelled`,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.detail || "Failed to create checkout session" },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json({
      checkout_url: data.checkout_url,
      session_id: data.session_id,
    });
  } catch (error) {
    console.error("Checkout session error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
