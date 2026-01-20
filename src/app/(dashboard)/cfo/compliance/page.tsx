"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { StatusChip } from "@/components/dashboard/StatusChip";
import AuditPanel from "@/components/audit/AuditPanel";
import {
  RetentionPanel,
  type RetentionPolicyView,
} from "@/components/enterprise/RetentionPanel";
import {
  ExportPackRequestPanel,
  type ExportPackRequest,
} from "@/components/enterprise/ExportPackRequestPanel";
import type { RbacSnapshot } from "@/lib/enterprise/rbac";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function CfoCompliancePage() {
  const [rbac, setRbac] = useState<RbacSnapshot | null>(null);
  const [policy, setPolicy] = useState<RetentionPolicyView | null>(null);
  const [exportResult, setExportResult] = useState<{
    variant: "ok" | "warn";
    message: string;
  } | null>(null);

  useEffect(() => {
    apiFetch<RbacSnapshot>("/api/rbac")
      .then((data) => {
        setRbac(data);
      })
      .catch(() => {
        setRbac(null);
      });

    apiFetch<RetentionPolicyView>("/api/retention?scope=evidence")
      .then((data) => {
        setPolicy(data);
      })
      .catch(() => {
        setPolicy(null);
      });
  }, []);

  async function handleExport(req: ExportPackRequest) {
    try {
      await apiFetch("/api/export-pack", {
        method: "POST",
        body: JSON.stringify(req),
      });
      setExportResult({
        variant: "ok",
        message: "Export pack requested successfully.",
      });
    } catch (error) {
      console.error("Export pack request failed", error);
      setExportResult({
        variant: "warn",
        message: "Export pack request failed. Please try again.",
      });
    }
  }

  return (
    <RouteShell
      title="CFO Compliance"
      subtitle="Audit logs, exports and evidence retention"
      right={
        <Button variant="secondary" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export All
        </Button>
      }
    >
      {/* Export result notification */}
      {exportResult && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-4">
          <StatusChip variant={exportResult.variant}>
            {exportResult.variant === "ok" ? "Success" : "Error"}
          </StatusChip>
          <p className="text-sm">{exportResult.message}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Primary Panel - Audit Log */}
        <div className="lg:col-span-8">
          <PrimaryPanel
            title="Audit Log"
            subtitle="System activity and compliance events"
          >
            <AuditPanel />
          </PrimaryPanel>

          {/* Retention Panel */}
          <div className="mt-6">
            <PrimaryPanel
              title="Evidence Retention"
              subtitle="Data retention policy and settings"
            >
              <RetentionPanel rbac={rbac} policy={policy} />
            </PrimaryPanel>
          </div>

          {/* Export Pack Panel */}
          <div className="mt-6">
            <PrimaryPanel
              title="Export Pack"
              subtitle="Request compliance export packages"
            >
              <ExportPackRequestPanel rbac={rbac} onRequest={handleExport} />
            </PrimaryPanel>
          </div>
        </div>

        {/* Secondary Panels */}
        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="Compliance Status">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Audit Entries
                </span>
                <span className="text-lg font-semibold">—</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Retention Period
                </span>
                <span className="text-lg font-semibold">
                  {policy?.days ? `${policy.days} days` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Export Packs
                </span>
                <span className="text-lg font-semibold">—</span>
              </div>
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="Access Control">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Retention Read
                </span>
                <StatusChip variant={rbac ? "ok" : "muted"}>
                  {rbac ? "Granted" : "—"}
                </StatusChip>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Export Request
                </span>
                <StatusChip variant={rbac ? "ok" : "muted"}>
                  {rbac ? "Granted" : "—"}
                </StatusChip>
              </div>
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="About Compliance">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                The compliance module provides audit logging, evidence retention
                management, and export pack generation for regulatory
                requirements.
              </p>
              <p>
                All actions are logged with timestamps and user attribution for
                audit trail purposes.
              </p>
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="Quick Links" collapsible>
            <div className="space-y-2 text-sm">
              <Link
                href="/cfo/executive-summary"
                className="block text-primary hover:underline"
              >
                Executive summary
              </Link>
              <Link
                href="/cfo/overview"
                className="block text-primary hover:underline"
              >
                CFO overview
              </Link>
              <Link
                href="/govcon/audit"
                className="block text-primary hover:underline"
              >
                GovCon audit trail
              </Link>
            </div>
          </SecondaryPanel>
        </div>
      </div>
    </RouteShell>
  );
}
