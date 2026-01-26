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
import { useApi } from "@/lib/useApi";
import { useOrg } from "@/lib/org-context";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { ROUTES } from "@/lib/routes";

/**
 * P0 FIX: Auth Propagation
 * - Uses useApi() hook for org context and auth headers
 * - Gates fetch behind isLoaded to prevent fetching before Clerk is ready
 */
export default function CfoCompliancePage() {
  const { apiFetch } = useApi();
  const { isLoaded: authReady } = useOrg();

  const [rbac, setRbac] = useState<RbacSnapshot | null>(null);
  const [policy, setPolicy] = useState<RetentionPolicyView | null>(null);
  const [exportResult, setExportResult] = useState<{
    variant: "ok" | "warn";
    message: string;
  } | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    // P0 FIX: Do NOT fetch until Clerk auth is fully loaded
    if (!authReady) return;

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
  }, [authReady, apiFetch]);

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

  async function handleExportAll() {
    setExporting(true);
    try {
      const response = await apiFetch<Response>("/api/cfo/export", {
        method: "POST",
      });
      if (response instanceof Response && response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `compliance_export_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      setExportResult({
        variant: "ok",
        message: "Compliance data exported successfully.",
      });
    } catch (error) {
      console.error("Export failed", error);
      setExportResult({
        variant: "warn",
        message: "Export failed. Please try again.",
      });
    } finally {
      setExporting(false);
    }
  }

  return (
    <RouteShell
      title="CFO Compliance"
      subtitle="Audit logs, exports and evidence retention"
      right={
        <Button
          variant="secondary"
          size="sm"
          onClick={handleExportAll}
          disabled={exporting}
        >
          {exporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
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
        {/* Primary Panel - Audit Log (ONE bg-background per page) */}
        <div className="lg:col-span-8">
          <PrimaryPanel
            title="Audit Log"
            subtitle="System activity and compliance events"
          >
            <AuditPanel />
          </PrimaryPanel>

          {/* BACKGROUND NORMALIZATION: Supporting sections use bg-card */}
          {/* Evidence Retention - SecondaryPanel (bg-card) */}
          <div className="mt-6">
            <SecondaryPanel title="Evidence Retention">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Data retention policy and settings
                </p>
                <RetentionPanel rbac={rbac} policy={policy} />
              </div>
            </SecondaryPanel>
          </div>

          {/* Export Pack - SecondaryPanel (bg-card) */}
          <div className="mt-6">
            <SecondaryPanel title="Export Pack">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Request compliance export packages
                </p>
                <ExportPackRequestPanel rbac={rbac} onRequest={handleExport} />
              </div>
            </SecondaryPanel>
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
                {/* P0 FIX: Show reason for unavailable data */}
                <span className="text-sm text-muted-foreground italic">
                  Requires audit log setup
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Retention Period
                </span>
                {policy?.days ? (
                  <span className="text-lg font-medium">
                    {policy.days} days
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground italic">
                    Not configured
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Export Packs
                </span>
                {/* P0 FIX: Show reason for unavailable data */}
                <span className="text-sm text-muted-foreground italic">
                  No packs requested
                </span>
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
                  {rbac ? "Granted" : "Pending setup"}
                </StatusChip>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Export Request
                </span>
                <StatusChip variant={rbac ? "ok" : "muted"}>
                  {rbac ? "Granted" : "Pending setup"}
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
                href={ROUTES.CFO_EXECUTIVE_SUMMARY}
                className="block text-primary hover:underline"
              >
                Executive summary
              </Link>
              <Link
                href={ROUTES.CFO_OVERVIEW}
                className="block text-primary hover:underline"
              >
                CFO overview
              </Link>
              <Link
                href={ROUTES.GOVCON_AUDIT}
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
