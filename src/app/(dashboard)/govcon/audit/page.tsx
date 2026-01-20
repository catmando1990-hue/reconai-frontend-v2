"use client";

import Link from "next/link";
import { Shield, Hash, Eye, AlertCircle } from "lucide-react";
import { STATUS } from "@/lib/dashboardCopy";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
import { EmptyState } from "@/components/dashboard/EmptyState";
import ExportForDCAAButton from "@/components/govcon/ExportForDCAAButton";
import ExportForDCAAPDFButton from "@/components/govcon/ExportForDCAAPDFButton";

export default function AuditPage() {
  return (
    <RouteShell
      title="Audit Trail"
      subtitle="Audit log with hash chain integrity for DCAA documentation"
      right={
        <div className="flex items-center gap-2">
          <ExportForDCAAButton className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors text-sm" />
          <ExportForDCAAPDFButton className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm" />
        </div>
      }
    >
      {/* TODO: UtilityStrip with search/filters will be enabled when audit entries exist */}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Primary Panel - Audit Timeline */}
        <div className="lg:col-span-8">
          <PrimaryPanel
            title="Audit Timeline"
            subtitle="Chronological record of all system events"
            actions={
              <Link
                href="/govcon/audit/verify"
                className="text-sm text-primary hover:underline"
              >
                Verify hash chain
              </Link>
            }
          >
            <EmptyState
              icon={Shield}
              title="No audit entries"
              description="Audit entries will appear here as system events occur. All modifications are automatically logged."
            />
          </PrimaryPanel>
        </div>

        {/* Secondary Panels */}
        <div className="space-y-4 lg:col-span-4">
          <SecondaryPanel title="Integrity Status">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {STATUS.NOT_EVALUATED}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    No audit entries to verify
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Entries</span>
                  <span className="font-medium text-muted-foreground">
                    {STATUS.NO_DATA}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">DCAA Relevant</span>
                  <span className="font-medium text-muted-foreground">
                    {STATUS.NO_DATA}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">With Evidence</span>
                  <span className="font-medium text-muted-foreground">
                    {STATUS.NO_DATA}
                  </span>
                </div>
              </div>
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="Quick Links">
            <nav className="space-y-2">
              <Link
                href="/govcon/evidence"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
              >
                <Eye className="h-4 w-4" />
                Evidence Viewer
              </Link>
              <Link
                href="/govcon/audit/verify"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
              >
                <Hash className="h-4 w-4" />
                Verify Hash Chain
              </Link>
            </nav>
          </SecondaryPanel>

          <SecondaryPanel title="Retention Policy" collapsible>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>Audit records retained for 6 years per FAR requirements.</p>
              <p>Evidence files stored with cryptographic verification.</p>
              <p>Export available in JSON and PDF formats.</p>
            </div>
          </SecondaryPanel>
        </div>
      </div>
    </RouteShell>
  );
}
