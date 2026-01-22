"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { getTierLimits, type SubscriptionTier } from "@/lib/entitlements";
import { Check, ExternalLink } from "lucide-react";
import {
  auditedFetch,
  AuditProvenanceError,
  HttpError,
} from "@/lib/auditedFetch";

/**
 * STEP 8: Dashboard Upgrade Panel
 *
 * LAWS COMPLIANCE:
 * - Dashboard-only (never on public/marketing routes)
 * - No dark patterns or urgency copy
 * - Opt-in only (manual button click)
 * - Enterprise is contract-only (contact sales)
 * - No Stripe JS loaded here (redirect to Stripe-hosted checkout)
 */

type UpgradeTier = {
  key: string;
  name: string;
  monthlyPrice: string;
  yearlyPrice: string;
  features: string[];
  recommended?: boolean;
};

type CheckoutResponse = {
  request_id: string;
  checkout_url?: string;
  error?: string;
};

const UPGRADE_TIERS: UpgradeTier[] = [
  {
    key: "starter",
    name: "Starter",
    monthlyPrice: "$29",
    yearlyPrice: "$290",
    features: [
      "5 exports per day",
      "50 signals depth",
      "500 transactions/month",
      "Email support",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    monthlyPrice: "$79",
    yearlyPrice: "$790",
    features: [
      "50 exports per day",
      "200 signals depth",
      "5,000 transactions/month",
      "Priority support",
      "Custom reports",
    ],
    recommended: true,
  },
  {
    key: "govcon",
    name: "GovCon",
    monthlyPrice: "$149",
    yearlyPrice: "$1,490",
    features: [
      "100 exports per day",
      "500 signals depth",
      "10,000 transactions/month",
      "Compliance templates",
      "Audit trail exports",
      "Dedicated support",
    ],
  },
];

interface UpgradePanelProps {
  currentTier?: SubscriptionTier;
}

export function UpgradePanel({ currentTier = "free" }: UpgradePanelProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "monthly",
  );

  const currentLimits = getTierLimits(currentTier);

  const handleUpgrade = async (tierKey: string) => {
    setLoading(tierKey);
    setError(null);

    try {
      const priceKey = `${tierKey}_${billingPeriod}`;
      const data = await auditedFetch<CheckoutResponse>(
        "/api/checkout/create-session",
        {
          method: "POST",
          body: JSON.stringify({ tier: priceKey }),
        },
      );

      // Redirect to Stripe-hosted checkout (no Stripe JS needed)
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (e) {
      if (e instanceof AuditProvenanceError) {
        setError(`Provenance error: ${e.message}`);
      } else if (e instanceof HttpError) {
        setError(`HTTP ${e.status}: ${e.message}`);
      } else {
        setError(e instanceof Error ? e.message : "Checkout failed");
      }
    } finally {
      setLoading(null);
    }
  };

  // Don't show upgrade panel if already on highest self-service tier
  if (currentTier === "enterprise") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Enterprise Plan</CardTitle>
          <CardDescription>
            You are on the Enterprise plan. Contact your account manager for
            changes.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upgrade Plan</CardTitle>
        <CardDescription>
          Current plan: {currentLimits.name}. Select a plan to upgrade.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Billing period toggle */}
        <div className="flex items-center justify-center gap-2 rounded-lg border p-1">
          <button
            type="button"
            onClick={() => setBillingPeriod("monthly")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              billingPeriod === "monthly"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingPeriod("yearly")}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              billingPeriod === "yearly"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Yearly (Save ~15%)
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Tier cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {UPGRADE_TIERS.map((tier) => {
            const isCurrentTier = tier.key === currentTier;
            const price =
              billingPeriod === "monthly"
                ? tier.monthlyPrice
                : tier.yearlyPrice;

            return (
              <div
                key={tier.key}
                className={`relative rounded-xl border p-4 ${
                  tier.recommended
                    ? "border-primary shadow-sm"
                    : "border-border"
                } ${isCurrentTier ? "bg-muted/30" : ""}`}
              >
                {tier.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                    Popular
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-lg font-semibold">{tier.name}</h3>
                  <div className="mt-1">
                    <span className="text-2xl font-bold">{price}</span>
                    <span className="text-sm text-muted-foreground">
                      /{billingPeriod === "monthly" ? "mo" : "yr"}
                    </span>
                  </div>
                </div>

                <ul className="mb-4 space-y-2 text-sm">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={tier.recommended ? "default" : "outline"}
                  disabled={isCurrentTier || loading !== null}
                  onClick={() => handleUpgrade(tier.key)}
                >
                  {loading === tier.key
                    ? "Loading..."
                    : isCurrentTier
                      ? "Current Plan"
                      : "Upgrade"}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Enterprise callout */}
        <div className="rounded-lg border border-dashed p-4 text-center">
          <h4 className="font-medium">Need Enterprise?</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Custom integrations, SSO, and dedicated support.
          </p>
          <Button variant="link" className="mt-2" asChild>
            <a href="/support">
              Contact Sales <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
