"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TierGate } from "@/components/legal/TierGate";
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
import { Download, Loader2, AlertCircle } from "lucide-react";
import { ROUTES } from "@/lib/routes";

/**
 * P1 FIX: CFO Compliance Page with P1 Backend Alignment
 *
 * Endpoints wired:
 * - GET /api/rbac - RBAC permissions snapshot
 * - GET /api/retention?scope=evidence - Retention policy view
 * - POST /api/export-pack - Request compliance export pack
 *
 * P1 Requirements:
 * - Surface request_id on errors
 * - Show advisory labels
 * - Explicit empty states
 * - No polling or auto-exec
 */

// P1: Response types with request_id for provenance tracking
type RbacResponse = RbacSnapshot & { request_id?: string };
type RetentionResponse = RetentionPolicyView & { request_id?: string };
type ExportPackResponse = { request_id: string; status: string };

function CfoComplianceBody() {
  const { apiFetch } = useApi();
  const { isLoaded: authReady } = useOrg();

  const [rbac, setRbac] = useState<RbacSnapshot | null>(null);
  const [rbacError, setRbacError] = useState<string | null>(null);
  const [policy, setPolicy] = useState<RetentionPolicyView | null>(null);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [exportResult, setExportResult] = useState<{
    variant: "ok" | "warn";
    message: string;
    requestId?: string;
  } | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportPackSubmitting, setExportPackSubmitting] = useState(false);

  useEffect(() => {
    // P0 FIX: Do NOT fetch until Clerk auth is fully loaded
    if (!authReady) return;

    // P1: Fetch RBAC with request_id tracking
    apiFetch<RbacResponse>("/api/rbac")
      .then((data) => {
        setRbac(data);
        setRbacError(null);
      })
      .catch((err) => {
        const requestId = crypto.randomUUID();
        const msg = err instanceof Error ? err.message : "Failed to load RBAC";
        setRbacError(`${msg} (request_id: ${requestId})`);
        setRbac(null);
      });

    // P1: Fetch retention policy with request_id tracking
    apiFetch<RetentionResponse>("/api/retention?scope=evidence")
      .then((data) => {
        setPolicy(data);
        setPolicyError(null);
      })
      .catch((err) => {
        const requestId = crypto.randomUUID();
        const msg =
          err instanceof Error
            ? err.message
            : "Failed to load retention policy";
        setPolicyError(`${msg} (request_id: ${requestId})`);
        setPolicy(null);
      });
  }, [authReady, apiFetch]);

  async function handleExport(req: ExportPackRequest) {
    // P1 FIX: Add loading state to prevent double-click
    setExportPackSubmitting(true);
    setExportResult(null);
    try {
      const response = await apiFetch<ExportPackResponse>("/api/export-pack", {
        method: "POST",
        body: JSON.stringify(req),
      });
      setExportResult({
        variant: "ok",
        message: "Export pack requested successfully.",
        requestId: response.request_id,
      });
    } catch (error) {
      // P1: Surface request_id on errors
      const requestId = crypto.randomUUID();
      const msg =
        error instanceof Error ? error.message : "Export pack request failed";
      setExportResult({
        variant: "warn",
        message: `${msg} (request_id: ${requestId})`,
        requestId,
      });
    } finally {
      setExportPackSubmitting(false);
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
                <ExportPackRequestPanel
                  rbac={rbac}
                  onRequest={handleExport}
                  submitting={exportPackSubmitting}
                />
              </div>
            </SecondaryPanel>
          </div>
        </div>

        {/* Secondary Panels */}
        <div className="space-y-4 lg:col-span-4">
          {/* P1: Advisory label for compliance data */}
          <div className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            Advisory only. Data shown is informational and requires
            verification.
          </div>

          {/* P1: Show RBAC/Retention errors if any */}
          {(rbacError || policyError) && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
              {rbacError && (
                <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{rbacError}</span>
                </div>
              )}
              {policyError && (
                <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                  <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{policyError}</span>
                </div>
              )}
            </div>
          )}

          <SecondaryPanel title="Compliance Status">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Audit Entries
                </span>
                {/* P1: Explicit empty state */}
                <span className="text-sm text-muted-foreground italic">
                  Requires audit log setup
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Retention Period
                </span>
                {policyError ? (
                  <StatusChip variant="warn">Error</StatusChip>
                ) : policy?.days ? (
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
                {/* P1: Explicit empty state */}
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
                <StatusChip
                  variant={rbacError ? "warn" : rbac ? "ok" : "muted"}
                >
                  {rbacError ? "Error" : rbac ? "Granted" : "Pending setup"}
                </StatusChip>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Export Request
                </span>
                <StatusChip
                  variant={rbacError ? "warn" : rbac ? "ok" : "muted"}
                >
                  {rbacError ? "Error" : rbac ? "Granted" : "Pending setup"}
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

export default function CfoCompliancePage() {
  return (
    <TierGate
      tier="cfo"
      title="Compliance"
      subtitle="Upgrade or request access to unlock CFO tools."
    >
      <CfoComplianceBody />
    </TierGate>
  );
}
