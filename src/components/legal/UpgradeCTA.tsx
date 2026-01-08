"use client";

// Phase 58 — Upgrade CTA (enterprise-safe, non-disruptive)
// Uses semantic tokens only; no hardcoded colors.

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function UpgradeCTA({
  href = "/packages",
  label = "View packages",
}: {
  href?: string;
  label?: string;
}) {
  return (
    <div className="mt-4 rounded-md border p-4">
      <div className="space-y-2">
        <p className="text-sm font-medium">Unlock this tier</p>
        <p className="text-sm text-muted-foreground">
          Request access or upgrade to enable Intelligence and CFO features for
          your workspace.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={href}>{label}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/support">Contact support</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
