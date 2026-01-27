"use client";

import { FinancialEvidenceProvider } from "@/lib/financial-evidence-context";
import EvidenceViewer from "@/components/govcon/audit/EvidenceViewer";
import PlaidStatementsEvidence from "@/components/govcon/audit/PlaidStatementsEvidence";
import NetWorthSnapshotPanel from "@/components/govcon/audit/NetWorthSnapshotPanel";
import LiabilitiesPanel from "@/components/govcon/audit/LiabilitiesPanel";
import InvestmentsPanel from "@/components/govcon/audit/InvestmentsPanel";
import ConsistencyAdvisory from "@/components/govcon/audit/ConsistencyAdvisory";

export default function EvidencePage() {
  return (
    <FinancialEvidenceProvider>
      <div className="space-y-8">
        <EvidenceViewer />

        {/* Consistency Advisory - RBAC gated (renders null for non-admin) */}
        <ConsistencyAdvisory />

        {/* Plaid Statements Section - RBAC gated (renders null for non-admin) */}
        <PlaidStatementsEvidence />

        {/* Net Worth Snapshots Section - RBAC gated (renders null for non-admin) */}
        <NetWorthSnapshotPanel />

        {/* Liabilities Section - RBAC gated (renders null for non-admin) */}
        <LiabilitiesPanel />

        {/* Investments Section - RBAC gated (renders null for non-admin) */}
        <InvestmentsPanel />
      </div>
    </FinancialEvidenceProvider>
  );
}
