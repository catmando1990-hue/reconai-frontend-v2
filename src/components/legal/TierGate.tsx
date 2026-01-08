"use client";

// Phase 45 — TierGate: consistent, enterprise-safe access gating wrapper

import React from "react";
import { hasAccess, type AccessTier } from "@/lib/access";
import { useOrg } from "@/lib/org-context";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { UpgradeCTA } from "@/components/legal/UpgradeCTA";

export function TierGate({
  tier,
  title,
  subtitle,
  children,
}: {
  tier: AccessTier;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const { role } = useOrg();
  const allowed = hasAccess(role, tier);

  if (!allowed) {
    return (
      <RouteShell
        title={title}
        subtitle={subtitle ?? "Upgrade or request access to unlock this tier."}
      >
        <div className="space-y-2">
          <p className="text-sm">
            This page is part of the {tier.toUpperCase()} tier. Request access
            or upgrade your plan to unlock it.
          </p>
          <p className="text-sm text-muted-foreground">
            Role detected: {role ?? "unknown"}.
          </p>
        </div>
        <UpgradeCTA />
      </RouteShell>
    );
  }

  return <>{children}</>;
}
