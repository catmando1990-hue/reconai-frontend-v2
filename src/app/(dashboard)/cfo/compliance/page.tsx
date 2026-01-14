"use client";

// Build 27: CFO Compliance page – Export notifications
//
// This file extends the Build 26 CFO Compliance page by introducing a
// persistent status message that surfaces the result of an export pack
// request. A success or error indicator appears above the panels once the
// request completes. No timers or background polling are introduced.

import { useEffect, useState } from "react";
import { RouteShell } from "@/components/dashboard/RouteShell";
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
import { StatusChip } from "@/components/dashboard/StatusChip";

export default function CfoCompliancePage() {
  // RBAC snapshot controls access to compliance panels. Defaults to null until fetched.
  const [rbac, setRbac] = useState<RbacSnapshot | null>(null);
  // Retention policy for evidence data. Defaults to null until fetched.
  const [policy, setPolicy] = useState<RetentionPolicyView | null>(null);
  // Tracks the result of the most recent export pack request. When non‑null,
  // a status message will be displayed to the user. The object contains a
  // variant ("ok" for success or "warn" for error) and a human‑readable
  // message. Note: we avoid timers or auto‑dismiss to comply with
  // performance laws — the message will persist until the next request.
  const [exportResult, setExportResult] = useState<{
    variant: "ok" | "warn";
    message: string;
  } | null>(null);

  // Fetch RBAC and retention policy on first render. These calls run once
  // without any polling or timers to adhere to ReconAI's performance laws.
  useEffect(() => {
    // Fetch the current RBAC snapshot. If unauthorized, set to null.
    apiFetch<RbacSnapshot>("/api/rbac")
      .then((data) => {
        setRbac(data);
      })
      .catch(() => {
        setRbac(null);
      });

    // Fetch the evidence retention policy. Scope is hardcoded to "evidence";
    // additional scopes can be requested in the future without modifying this page.
    apiFetch<RetentionPolicyView>("/api/retention?scope=evidence")
      .then((data) => {
        setPolicy(data);
      })
      .catch(() => {
        setPolicy(null);
      });
  }, []);

  // Handler invoked when the user requests an export pack. The request is
  // forwarded to the backend via `apiFetch`. This function is only called in
  // response to a user click; there is no automatic export trigger.
  async function handleExport(req: ExportPackRequest) {
    try {
      await apiFetch("/api/export-pack", {
        method: "POST",
        body: JSON.stringify(req),
      });
      // Update result state to show a success message. Using StatusChip
      // with variant "ok" signals success. We avoid console.log here to
      // reduce noise in production.
      setExportResult({
        variant: "ok",
        message: "Export pack requested successfully.",
      });
    } catch (error) {
      // Log errors to aid debugging; UI components can surface user‑friendly
      // messages via StatusChip outside of this handler.
      console.error("Export pack request failed", error);
      // Surface an error state to the UI. Using StatusChip with variant
      // "warn" ensures the chip uses a muted tone rather than a success color.
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
    >
      <div className="space-y-6">
        {/* Display export result if present. Uses StatusChip to maintain
            semantic token rules. This section is shown only after an export
            request has completed. */}
        {exportResult && (
          <div className="flex items-center space-x-2 rounded border p-3">
            <StatusChip variant={exportResult.variant}>
              {exportResult.variant === "ok" ? "Success" : "Error"}
            </StatusChip>
            <p className="text-sm">{exportResult.message}</p>
          </div>
        )}

        {/* Read‑only audit log. Uses internal refresh every 30s but introduces no new polling. */}
        <AuditPanel />

        {/* Evidence retention policy. Accessible only if the current RBAC snapshot
            includes the "retention.read" permission. */}
        <RetentionPanel rbac={rbac} policy={policy} />

        {/* Export pack request. Visible only if the user has the
            "export.request" permission. */}
        <ExportPackRequestPanel rbac={rbac} onRequest={handleExport} />
      </div>
    </RouteShell>
  );
}
