"use client";

import { useState } from "react";
import { RouteShell } from "@/components/dashboard/RouteShell";
import { PrimaryPanel } from "@/components/dashboard/PrimaryPanel";
import { SecondaryPanel } from "@/components/dashboard/SecondaryPanel";
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
  Building,
  Plus,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Shield,
  FileText,
} from "lucide-react";
import { useApi } from "@/lib/useApi";
import useSWR from "swr";

interface Connection {
  id: string;
  connection_type: string;
  institution_name: string;
  account_name: string;
  account_type: string;
  contract_id: string | null;
  cost_pool: string;
  status: string;
  verified_at: string | null;
  created_at: string;
}

const COST_POOL_LABELS: Record<string, string> = {
  direct: "Direct Costs",
  indirect: "Indirect Costs",
  overhead: "Overhead",
  g_and_a: "G&A",
  fringe: "Fringe Benefits",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  pending_verification: { label: "Pending Verification", color: "text-amber-500", icon: Clock },
  verified: { label: "Verified", color: "text-green-500", icon: CheckCircle },
  rejected: { label: "Rejected", color: "text-red-500", icon: AlertCircle },
};

function GovConConnectBody() {
  const { apiFetch, auditedPost } = useApi();
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manual form state (GovCon is manual-only for DCAA compliance)
  const [form, setForm] = useState({
    institution_name: "",
    account_name: "",
    account_type: "checking",
    account_number_last4: "",
    routing_number_last4: "",
    contract_id: "",
    cost_pool: "direct",
    authorization_date: "",
    authorized_by: "",
  });

  // Fetch existing connections
  const { data, mutate } = useSWR<{ connections: Connection[] }>(
    "/api/govcon/connections",
    apiFetch
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await auditedPost("/api/govcon/connections", {
        ...form,
        contract_id: form.contract_id || null,
      });
      mutate();
      setShowForm(false);
      setForm({
        institution_name: "",
        account_name: "",
        account_type: "checking",
        account_number_last4: "",
        routing_number_last4: "",
        contract_id: "",
        cost_pool: "direct",
        authorization_date: "",
        authorized_by: "",
      });
    } catch {
      setError("Failed to add account");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RouteShell
      title="GovCon Bank Connections"
      subtitle="DCAA-compliant bank account management"
    >
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8 space-y-6">
          {/* Existing Connections */}
          <PrimaryPanel
            title="Connected Accounts"
            subtitle="Bank accounts linked to GovCon tier"
          >
            {data?.connections && data.connections.length > 0 ? (
              <div className="divide-y divide-border">
                {data.connections.map((conn) => {
                  const statusConfig = STATUS_CONFIG[conn.status] || STATUS_CONFIG.pending_verification;
                  const StatusIcon = statusConfig.icon;

                  return (
                    <div
                      key={conn.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{conn.institution_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {conn.account_name} • {COST_POOL_LABELS[conn.cost_pool] || conn.cost_pool}
                          </p>
                          {conn.contract_id && (
                            <p className="text-xs text-muted-foreground">
                              Contract: {conn.contract_id}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1 text-sm ${statusConfig.color}`}>
                          <StatusIcon className="w-4 h-4" />
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
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
            subtitle="Manual entry only for DCAA compliance"
          >
            {!showForm ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-4">
                  GovCon accounts require manual entry and verification for DCAA compliance.
                  All connections start in &quot;Pending Verification&quot; status.
                </p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Bank Account
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Institution Details */}
                <div>
                  <h4 className="font-medium text-sm mb-3">Institution Details</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="institution">Institution Name</Label>
                      <Input
                        id="institution"
                        placeholder="e.g., First National Bank"
                        value={form.institution_name}
                        onChange={(e) =>
                          setForm({ ...form, institution_name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account_name">Account Name</Label>
                      <Input
                        id="account_name"
                        placeholder="e.g., Contract Operating Account"
                        value={form.account_name}
                        onChange={(e) =>
                          setForm({ ...form, account_name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account_type">Account Type</Label>
                      <Select
                        value={form.account_type}
                        onValueChange={(v) =>
                          setForm({ ...form, account_type: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checking">Checking</SelectItem>
                          <SelectItem value="savings">Savings</SelectItem>
                          <SelectItem value="trust">Trust Account</SelectItem>
                          <SelectItem value="escrow">Escrow Account</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="account_last4">Account # (Last 4)</Label>
                      <Input
                        id="account_last4"
                        placeholder="1234"
                        maxLength={4}
                        value={form.account_number_last4}
                        onChange={(e) =>
                          setForm({ ...form, account_number_last4: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Cost Allocation */}
                <div>
                  <h4 className="font-medium text-sm mb-3">Cost Allocation</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="cost_pool">Cost Pool</Label>
                      <Select
                        value={form.cost_pool}
                        onValueChange={(v) =>
                          setForm({ ...form, cost_pool: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="direct">Direct Costs</SelectItem>
                          <SelectItem value="indirect">Indirect Costs</SelectItem>
                          <SelectItem value="overhead">Overhead</SelectItem>
                          <SelectItem value="g_and_a">G&A</SelectItem>
                          <SelectItem value="fringe">Fringe Benefits</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contract_id">Contract ID (optional)</Label>
                      <Input
                        id="contract_id"
                        placeholder="e.g., FA8650-21-C-1234"
                        value={form.contract_id}
                        onChange={(e) =>
                          setForm({ ...form, contract_id: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Authorization */}
                <div>
                  <h4 className="font-medium text-sm mb-3">Authorization (DCAA Required)</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="authorization_date">Authorization Date</Label>
                      <Input
                        id="authorization_date"
                        type="date"
                        value={form.authorization_date}
                        onChange={(e) =>
                          setForm({ ...form, authorization_date: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="authorized_by">Authorized By</Label>
                      <Input
                        id="authorized_by"
                        placeholder="e.g., John Smith, CFO"
                        value={form.authorized_by}
                        onChange={(e) =>
                          setForm({ ...form, authorized_by: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}

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
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </PrimaryPanel>
        </div>

        {/* Info Panel */}
        <div className="lg:col-span-4 space-y-4">
          <SecondaryPanel title="DCAA Compliance">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Government contract accounting requires strict separation and
                documentation of bank accounts used for contract funds.
              </p>
              <div className="flex items-start gap-2">
                <Shield className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                <p>
                  All accounts require authorization documentation and start
                  in &quot;Pending Verification&quot; status.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                <p>
                  Upload supporting documentation to expedite verification.
                </p>
              </div>
            </div>
          </SecondaryPanel>

          <SecondaryPanel title="Cost Pools">
            <ul className="text-sm text-muted-foreground space-y-2">
              <li><strong>Direct</strong> - Costs charged directly to contracts</li>
              <li><strong>Indirect</strong> - Shared costs allocated to contracts</li>
              <li><strong>Overhead</strong> - Manufacturing/production overhead</li>
              <li><strong>G&A</strong> - General & Administrative expenses</li>
              <li><strong>Fringe</strong> - Employee benefits and fringe costs</li>
            </ul>
          </SecondaryPanel>
        </div>
      </div>
    </RouteShell>
  );
}

export default function GovConConnectPage() {
  return (
    <TierGate tier="govcon" title="GovCon Connections" subtitle="Upgrade to access GovCon features">
      <GovConConnectBody />
    </TierGate>
  );
}
