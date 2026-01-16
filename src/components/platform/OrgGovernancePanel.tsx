'use client';

import * as React from 'react';

/**
 * STEP 22 — Org-Level Governance Dashboard Panel
 *
 * Read-only views for:
 * - Governance snapshot
 * - Compliance status (DCAA, SOC 2, data retention)
 * - Access control summary (roles, permissions)
 * - Data policy status (retention, export, deletion)
 *
 * Manual refresh only. Dashboard-only.
 */

type GovernanceSnapshot = {
  organization: {
    id: string;
    tier: string;
    tier_name: string;
    created_at: string | null;
    user_count: number;
  };
  compliance: {
    dcaa_status: string;
    soc2_status: string;
    data_retention: string;
    last_audit: string | null;
  };
  access_controls: {
    rbac_enabled: boolean;
    mfa_enforced: boolean;
    session_timeout_minutes: number;
    ip_allowlist_enabled: boolean;
  };
  data_policies: {
    retention_days: number;
    export_enabled: boolean;
    deletion_enabled: boolean;
    encryption_at_rest: boolean;
    encryption_in_transit: boolean;
  };
  capabilities: {
    compliance_reports: boolean;
    soc2_tracker: boolean;
    data_retention_controls: boolean;
  };
  recent_events: Array<{
    action: string;
    timestamp: string;
  }>;
};

type ComplianceFramework = {
  framework: string;
  status: string;
  last_assessment: string | null;
  next_assessment: string | null;
  controls_met: number;
  controls_total: number;
  gaps: Array<{
    control: string;
    description: string;
  }>;
};

type SnapshotResponse = {
  request_id: string;
  snapshot: GovernanceSnapshot;
  generated_at: string;
};

type ComplianceResponse = {
  request_id: string;
  compliance: {
    org_id: string;
    tier: string;
    frameworks: ComplianceFramework[];
    overall_status: string;
  };
  timestamp: string;
};

export function OrgGovernancePanel({ apiBase }: { apiBase: string }) {
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [snapshot, setSnapshot] = React.useState<GovernanceSnapshot | null>(null);
  const [compliance, setCompliance] = React.useState<ComplianceResponse['compliance'] | null>(null);
  const [requestId, setRequestId] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'overview' | 'compliance' | 'access' | 'data'>('overview');

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [snapshotRes, complianceRes] = await Promise.all([
        fetch(`${apiBase}/api/org/governance/snapshot`, { credentials: 'include' }),
        fetch(`${apiBase}/api/org/governance/compliance`, { credentials: 'include' }),
      ]);

      if (!snapshotRes.ok) throw new Error(`Snapshot: HTTP ${snapshotRes.status}`);
      if (!complianceRes.ok) throw new Error(`Compliance: HTTP ${complianceRes.status}`);

      const snapshotData: SnapshotResponse = await snapshotRes.json();
      const complianceData: ComplianceResponse = await complianceRes.json();

      setSnapshot(snapshotData.snapshot);
      setCompliance(complianceData.compliance);
      setRequestId(snapshotData.request_id);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to load governance data');
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
      case 'active':
      case 'enabled':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
      case 'basic':
        return 'bg-blue-100 text-blue-800';
      case 'attention_required':
      case 'warning':
        return 'bg-amber-100 text-amber-800';
      case 'not_applicable':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatTimestamp = (ts: string | null) => {
    if (!ts) return 'N/A';
    try {
      return new Date(ts).toLocaleDateString();
    } catch {
      return ts;
    }
  };

  return (
    <div className="rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium">Org Governance Dashboard</div>
          <div className="text-xs opacity-70">
            Compliance, access controls, and data policies. Read-only.
          </div>
        </div>
        <button
          type="button"
          onClick={fetchData}
          disabled={loading}
          className="rounded-xl border px-3 py-2 text-sm"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {err ? <div className="mt-3 text-sm text-red-500">{err}</div> : null}

      {/* Tabs */}
      <div className="mt-4 flex gap-2 border-b">
        {(['overview', 'compliance', 'access', 'data'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-sm capitalize ${
              activeTab === tab
                ? 'border-b-2 border-blue-500 font-medium'
                : 'opacity-70'
            }`}
          >
            {tab === 'access' ? 'Access Controls' : tab === 'data' ? 'Data Policies' : tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && snapshot ? (
        <div className="mt-4 space-y-4">
          {/* Organization Summary */}
          <div className="rounded-xl border p-4">
            <div className="font-medium mb-3">Organization</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-xs opacity-70">Tier</div>
                <div className="font-medium capitalize">{snapshot.organization.tier_name}</div>
              </div>
              <div>
                <div className="text-xs opacity-70">Users</div>
                <div className="font-medium">{snapshot.organization.user_count}</div>
              </div>
              <div>
                <div className="text-xs opacity-70">Created</div>
                <div className="text-sm">{formatTimestamp(snapshot.organization.created_at)}</div>
              </div>
              <div>
                <div className="text-xs opacity-70">Org ID</div>
                <div className="font-mono text-xs">{snapshot.organization.id.slice(0, 8)}...</div>
              </div>
            </div>
          </div>

          {/* Quick Status Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl border p-3 text-center">
              <div className={`inline-block px-2 py-1 rounded text-xs ${getStatusColor(snapshot.compliance.dcaa_status)}`}>
                {snapshot.compliance.dcaa_status.replace(/_/g, ' ')}
              </div>
              <div className="text-xs opacity-70 mt-1">DCAA</div>
            </div>
            <div className="rounded-xl border p-3 text-center">
              <div className={`inline-block px-2 py-1 rounded text-xs ${getStatusColor(snapshot.compliance.soc2_status)}`}>
                {snapshot.compliance.soc2_status.replace(/_/g, ' ')}
              </div>
              <div className="text-xs opacity-70 mt-1">SOC 2</div>
            </div>
            <div className="rounded-xl border p-3 text-center">
              <div className={`inline-block px-2 py-1 rounded text-xs ${getStatusColor(snapshot.access_controls.mfa_enforced ? 'enabled' : 'not_applicable')}`}>
                {snapshot.access_controls.mfa_enforced ? 'Enforced' : 'Optional'}
              </div>
              <div className="text-xs opacity-70 mt-1">MFA</div>
            </div>
            <div className="rounded-xl border p-3 text-center">
              <div className={`inline-block px-2 py-1 rounded text-xs ${getStatusColor(snapshot.data_policies.encryption_at_rest ? 'enabled' : 'not_applicable')}`}>
                {snapshot.data_policies.encryption_at_rest ? 'Active' : 'Inactive'}
              </div>
              <div className="text-xs opacity-70 mt-1">Encryption</div>
            </div>
          </div>

          {/* Capabilities */}
          <div className="rounded-xl border p-4">
            <div className="font-medium mb-3">Tier Capabilities</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(snapshot.capabilities).map(([key, enabled]) => (
                <span
                  key={key}
                  className={`px-2 py-1 rounded text-xs ${
                    enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {key.replace(/_/g, ' ')}: {enabled ? 'Yes' : 'No'}
                </span>
              ))}
            </div>
          </div>

          {/* Recent Events */}
          {snapshot.recent_events.length > 0 ? (
            <div className="rounded-xl border p-4">
              <div className="font-medium mb-3">Recent Governance Events</div>
              <div className="space-y-2">
                {snapshot.recent_events.map((event, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="capitalize">{event.action.replace(/_/g, ' ')}</span>
                    <span className="text-xs opacity-70">{formatTimestamp(event.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Compliance Tab */}
      {activeTab === 'compliance' && compliance ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-medium">Compliance Status</div>
              <span className={`px-2 py-1 rounded text-xs ${getStatusColor(compliance.overall_status)}`}>
                {compliance.overall_status.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="space-y-4">
              {compliance.frameworks.map((framework) => (
                <div key={framework.framework} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{framework.framework}</div>
                    <span className={`px-2 py-1 rounded text-xs ${getStatusColor(framework.status)}`}>
                      {framework.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-xs opacity-70">Controls</div>
                      <div>{framework.controls_met}/{framework.controls_total}</div>
                    </div>
                    <div>
                      <div className="text-xs opacity-70">Last Assessment</div>
                      <div>{formatTimestamp(framework.last_assessment)}</div>
                    </div>
                    <div>
                      <div className="text-xs opacity-70">Next Assessment</div>
                      <div>{formatTimestamp(framework.next_assessment)}</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500"
                        style={{ width: `${(framework.controls_met / framework.controls_total) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Gaps */}
                  {framework.gaps.length > 0 ? (
                    <div className="mt-3">
                      <div className="text-xs opacity-70 mb-2">Gaps ({framework.gaps.length})</div>
                      <div className="space-y-1">
                        {framework.gaps.map((gap, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs">
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono">
                              {gap.control}
                            </span>
                            <span className="opacity-70">{gap.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Access Controls Tab */}
      {activeTab === 'access' && snapshot ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border p-4">
            <div className="font-medium mb-3">Access Control Settings</div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-3">
                <div className="text-sm font-medium">RBAC</div>
                <div className={`mt-1 text-xs ${snapshot.access_controls.rbac_enabled ? 'text-green-600' : 'text-gray-500'}`}>
                  {snapshot.access_controls.rbac_enabled ? 'Enabled' : 'Disabled'}
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-sm font-medium">MFA</div>
                <div className={`mt-1 text-xs ${snapshot.access_controls.mfa_enforced ? 'text-green-600' : 'text-gray-500'}`}>
                  {snapshot.access_controls.mfa_enforced ? 'Enforced' : 'Optional'}
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-sm font-medium">Session Timeout</div>
                <div className="mt-1 text-xs">{snapshot.access_controls.session_timeout_minutes} minutes</div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-sm font-medium">IP Allowlist</div>
                <div className={`mt-1 text-xs ${snapshot.access_controls.ip_allowlist_enabled ? 'text-green-600' : 'text-gray-500'}`}>
                  {snapshot.access_controls.ip_allowlist_enabled ? 'Enabled' : 'Not Available'}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Data Policies Tab */}
      {activeTab === 'data' && snapshot ? (
        <div className="mt-4 space-y-4">
          <div className="rounded-xl border p-4">
            <div className="font-medium mb-3">Data Policy Settings</div>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="text-sm font-medium">Data Retention</div>
                  <div className="text-xs opacity-70">Automatic data retention period</div>
                </div>
                <div className="text-sm font-medium">{snapshot.data_policies.retention_days} days</div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="text-sm font-medium">Export</div>
                  <div className="text-xs opacity-70">Data export capability</div>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${snapshot.data_policies.export_enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                  {snapshot.data_policies.export_enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="text-sm font-medium">Deletion</div>
                  <div className="text-xs opacity-70">Right to delete data</div>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${snapshot.data_policies.deletion_enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                  {snapshot.data_policies.deletion_enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="text-sm font-medium">Encryption at Rest</div>
                  <div className="text-xs opacity-70">Data encrypted when stored</div>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${snapshot.data_policies.encryption_at_rest ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {snapshot.data_policies.encryption_at_rest ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="text-sm font-medium">Encryption in Transit</div>
                  <div className="text-xs opacity-70">Data encrypted during transfer</div>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${snapshot.data_policies.encryption_in_transit ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {snapshot.data_policies.encryption_in_transit ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {requestId ? (
        <div className="mt-3 text-xs opacity-50">Request ID: {requestId}</div>
      ) : null}
    </div>
  );
}
