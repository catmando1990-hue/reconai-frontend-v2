"use client";

import { RouteShell } from "@/components/dashboard/RouteShell";
import { ConnectBankButton } from "@/components/plaid/ConnectBankButton";
import { ConnectedAccounts } from "@/components/plaid/ConnectedAccounts";

/**
 * Core Bank Connections
 *
 * This page manages bank connections for the Core module only.
 * Each module (Core, CFO, Payroll, GovCon) has its own isolated
 * bank connection management with no data bleeding between modules.
 */
export default function CoreConnectPage() {
  return (
    <RouteShell
      title="Bank Connections"
      subtitle="Connect bank accounts for Core financial tracking"
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
          {/* Connect New Account */}
          <section className="rounded-xl border bg-card p-6">
            <h2 className="text-lg font-semibold mb-2">Connect Your Bank</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Securely link your financial accounts. ReconAI uses Plaid Link to
              connect and will never ask for your bank password directly.
            </p>

            <ConnectBankButton />

            <p className="mt-6 text-xs text-muted-foreground">
              ReconAI is not a bank, CPA, accountant, tax advisor, or law firm.
              Outputs are informational only and require user review.
            </p>
          </section>

          {/* Connected Accounts */}
          <ConnectedAccounts />
        </div>

        {/* Info Panel */}
        <div className="lg:col-span-4">
          <div className="rounded-xl border bg-card p-4 sticky top-4">
            <h3 className="font-medium mb-2">About Core Connections</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Bank accounts connected here are used for Core module features
              including transaction tracking, reports, and account reconciliation.
            </p>

            <h4 className="font-medium text-sm mb-1">Core Features</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Transaction ledger</li>
              <li>• Account activity reports</li>
              <li>• Cash flow statements</li>
              <li>• Statement reconciliation</li>
              <li>• Category spend analysis</li>
            </ul>

            <div className="mt-4 pt-4 border-t">
              <h4 className="font-medium text-sm mb-1">Data Isolation</h4>
              <p className="text-xs text-muted-foreground">
                Connections made here are isolated to the Core module. CFO,
                Payroll, and GovCon modules manage their own separate connections.
              </p>
            </div>
          </div>
        </div>
      </div>
    </RouteShell>
  );
}
