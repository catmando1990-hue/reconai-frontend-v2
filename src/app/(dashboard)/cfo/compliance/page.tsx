"use client";

// Build 26: CFO Compliance page
//
// This page implements the audit export surface and evidence retention UX for
// ReconAI's CFO mode. It replaces the previous placeholder with three
// read‑only panels:
// 1. AuditPanel – shows recent audit log entries (read‑only; existing refresh).
// 2. RetentionPanel – displays the current evidence data retention policy.
// 3. ExportPackRequestPanel – allows authorized users to request an export pack
//    containing audit, evidence, and policy data. This is a manual action and
//    does not trigger any automatic exports.

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

export default function CfoCompliancePage() {
  // RBAC snapshot controls access to compliance panels. Defaults to null until fetched.
  const [rbac, setRbac] = useState<RbacSnapshot | null>(null);
  // Retention policy for evidence data. Defaults to null until fetched.
  const [policy, setPolicy] = useState<RetentionPolicyView | null>(null);

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
      // Successful request; consumers can surface a toast or status message.
      // For now we log to the console for traceability.
      console.log("Export pack requested", req);
    } catch (error) {
      // Log errors to aid debugging; UI components can surface user‑friendly
      // messages via toasts or banners outside of this handler.
      console.error("Export pack request failed", error);
    }
  }

  return (
    <RouteShell
      title="CFO Compliance"
      subtitle="Audit logs, exports and evidence retention"
    >
      <div className="space-y-6">
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
