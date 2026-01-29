"use client";

import { useState } from "react";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { TierGate } from "@/components/legal/TierGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  CreditCard,
  Link2,
  Plus,
  Loader2,
  CheckCircle,
  AlertCircle,
  Wallet,
} from "lucide-react";
import { useApi } from "@/lib/useApi";
import useSWR from "swr";

type ConnectionType = "plaid" | "manual";

interface Connection {
  id: string;
  connection_type: string;
  institution_name: string;
  account_name: string | null;
  account_type: string | null;
  purpose: string | null;
  status: string;
  created_at: string;
}

const PURPOSE_LABELS: Record<string, string> = {
  payroll_funding: "Payroll Funding",
  tax_payments: "Tax Payments",
  benefits: "Benefits",
  general: "General",
};

function PayrollConnectBody() {
  const { apiFetch, auditedPost } = useApi();
  const [connectionType, setConnectionType] = useState<ConnectionType | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manual form state
  const [manualForm, setManualForm] = useState({
    institution_name: "",
    account_name: "",
    account_type: "checking",
    account_mask: "",
    purpose: "payroll_funding",
  });

  // Fetch existing connections
  const { data, mutate } = useSWR<{ connections: Connection[] }>(
    "/api/payroll/connections",
    apiFetch,
  );

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await auditedPost("/api/payroll/connections/manual", manualForm);
      mutate();
      setConnectionType(null);
      setManualForm({
        institution_name: "",
        account_name: "",
        account_type: "checking",
        account_mask: "",
        purpose: "payroll_funding",
      });
    } catch {
      setError("Failed to add account");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RouteShell
      title="Payroll Bank Connections"
      subtitle="Connect bank accounts for payroll processing"
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
          {/* Existing Connections */}
          <PrimaryPanel
            title="Connected Accounts"
            subtitle="Bank accounts linked to Payroll tier"
          >
            {data?.connections && data.connections.length > 0 ? (
              <div className="divide-y divide-border">
                {data.connections.map((conn) => (
                  <div
                    key={conn.id}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{conn.institution_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {conn.account_name || conn.account_type || "Account"}
                          {conn.purpose &&
                            ` • ${PURPOSE_LABELS[conn.purpose] || conn.purpose}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {conn.status === "active" ? (
                        <span className="flex items-center gap-1 text-sm text-green-500">
                          <CheckCircle className="w-4 h-4" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-sm text-amber-500">
                          <AlertCircle className="w-4 h-4" />
                          {conn.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4">
                No accounts connected yet. Add your first connection below.
              </p>
            )}
          </PrimaryPanel>

          {/* Add New Connection */}
          <PrimaryPanel
            title="Add Connection"
            subtitle="Choose how to connect your bank account"
          >
            {!connectionType ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <button
                  onClick={() => setConnectionType("plaid")}
                  className="flex flex-col items-center gap-3 p-6 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Link2 className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Connect with Plaid</p>
                    <p className="text-sm text-muted-foreground">
                      Securely link your bank account
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setConnectionType("manual")}
                  className="flex flex-col items-center gap-3 p-6 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium">Manual Entry</p>
                    <p className="text-sm text-muted-foreground">
                      Add account details manually
                    </p>
                  </div>
                </button>
              </div>
            ) : connectionType === "plaid" ? (
              <div className="text-center py-6">
                <p className="mb-4 text-muted-foreground">
                  Plaid integration coming soon. Use manual entry for now.
                </p>
                <Button variant="ghost" onClick={() => setConnectionType(null)}>
                  Back
                </Button>
              </div>
            ) : (
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="institution">Institution Name</Label>
                    <Input
                      id="institution"
                      placeholder="e.g., Chase Bank"
                      value={manualForm.institution_name}
                      onChange={(e) =>
                        setManualForm({
                          ...manualForm,
                          institution_name: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account_name">Account Name</Label>
                    <Input
                      id="account_name"
                      placeholder="e.g., Payroll Account"
                      value={manualForm.account_name}
                      onChange={(e) =>
                        setManualForm({
                          ...manualForm,
                          account_name: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account_type">Account Type</Label>
                    <Select
                      value={manualForm.account_type}
                      onValueChange={(v) =>
                        setManualForm({ ...manualForm, account_type: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="checking">Checking</SelectItem>
                        <SelectItem value="savings">Savings</SelectItem>
                        <SelectItem value="payroll">Payroll Account</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="purpose">Account Purpose</Label>
                    <Select
                      value={manualForm.purpose}
                      onValueChange={(v) =>
                        setManualForm({ ...manualForm, purpose: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="payroll_funding">
                          Payroll Funding
                        </SelectItem>
                        <SelectItem value="tax_payments">
                          Tax Payments
                        </SelectItem>
                        <SelectItem value="benefits">Benefits</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="account_mask">
                      Last 4 Digits (optional)
                    </Label>
                    <Input
                      id="account_mask"
                      placeholder="1234"
                      maxLength={4}
                      value={manualForm.account_mask}
                      onChange={(e) =>
                        setManualForm({
                          ...manualForm,
                          account_mask: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="flex gap-2">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Add Account
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setConnectionType(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </PrimaryPanel>
        </div>

        {/* Info Panel */}
        <div className="lg:col-span-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-medium mb-2">About Payroll Connections</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Bank accounts connected here are used exclusively for payroll
              processing. Designate accounts for specific purposes to maintain
              clear separation of funds.
            </p>
            <h4 className="font-medium text-sm mb-1">Account Purposes</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>
                • <strong>Payroll Funding</strong> - Main payroll disbursement
              </li>
              <li>
                • <strong>Tax Payments</strong> - Withholding deposits
              </li>
              <li>
                • <strong>Benefits</strong> - Benefits administration
              </li>
              <li>
                • <strong>General</strong> - Other payroll-related
              </li>
            </ul>
          </div>
        </div>
      </div>
    </RouteShell>
  );
}

export default function PayrollConnectPage() {
  return (
    <TierGate
      tier="payroll"
      title="Payroll Connections"
      subtitle="Upgrade to access Payroll features"
    >
      <PayrollConnectBody />
    </TierGate>
  );
}
