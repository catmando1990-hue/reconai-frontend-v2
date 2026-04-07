"use client";

import { AlertTriangle, CheckCircle, Clock, Download, Edit3, FileText, Hash, RefreshCw, Shield, Upload } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { govconApi } from '@/api';
import PolicyBanner from '@/components/recon/PolicyBanner';
import '@/styles/govcon/GovConAudit.css';

const iconMap = {
  upload: Upload,
  refresh: RefreshCw,
  check: CheckCircle,
  edit: Edit3,
  file: FileText,
  alert: AlertTriangle,
};

function resolveIcon(entry) {
  // Try to match an icon key from the backend
  const key = (entry.icon ?? entry.icon_key ?? entry.iconKey ?? '').toLowerCase();
  if (iconMap[key]) return iconMap[key];

  // Fall back based on title keywords
  const title = (entry.title ?? '').toLowerCase();
  if (title.includes('submit')) return Upload;
  if (title.includes('rate') || title.includes('update')) return RefreshCw;
  if (title.includes('reconcil') || title.includes('verif')) return CheckCircle;
  if (title.includes('modif') || title.includes('correct')) return Edit3;
  if (title.includes('invoice') || title.includes('report')) return FileText;
  if (title.includes('alert') || title.includes('warn')) return AlertTriangle;
  return FileText;
}

export default function GovConAudit() {
  const [kpis, setKpis] = useState([]);
  const [timelineEntries, setTimelineEntries] = useState([]);
  const [evidenceItems, setEvidenceItems] = useState([]);
  const [exportHistory, setExportHistory] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await govconApi.getAuditTrail();
      const data = res.data ?? res;

      // Normalize KPIs
      const rawKpis = data.kpis ?? data.summary ?? [];
      if (Array.isArray(rawKpis) && rawKpis.length > 0) {
        setKpis(
          rawKpis.map((k) => ({
            label: k.label ?? k.name ?? '',
            value: k.value ?? '',
            icon: k.icon ?? 'file',
          }))
        );
      } else {
        setKpis([
          { label: 'Total Records', value: data.total_records ?? data.totalRecords ?? '—', icon: 'file' },
          { label: 'Chain Integrity', value: data.chain_integrity ?? data.chainIntegrity ?? '—', icon: 'check' },
          { label: 'Retention Period', value: data.retention_period ?? data.retentionPeriod ?? '—', icon: 'alert' },
        ]);
      }

      // Normalize timeline entries
      const entries = data.entries ?? data.timeline ?? data.audit_entries ?? data.auditEntries ?? [];
      setTimelineEntries(
        entries.map((e, i) => ({
          date: e.date ?? e.timestamp ?? '',
          title: e.title ?? e.action ?? '',
          description: e.description ?? e.detail ?? '',
          hash: e.hash ?? e.chain_hash ?? e.chainHash ?? '',
          recent: e.recent ?? i < 2,
          _raw: e,
        }))
      );

      // Normalize evidence items
      const evidence = data.evidence ?? data.evidence_items ?? data.evidenceItems ?? [];
      setEvidenceItems(
        evidence.map((item) => ({
          label: item.label ?? item.name ?? '',
          status: item.status ?? '',
          color: item.color ?? (item.status === 'Current' ? 'green' : 'amber'),
        }))
      );

      // Export history
      setExportHistory({
        lastExport: data.last_export ?? data.lastExport ?? data.export_history?.last_export ?? '—',
        format: data.export_format ?? data.exportFormat ?? data.export_history?.format ?? '—',
        records: data.export_records ?? data.exportRecords ?? data.export_history?.records ?? '—',
      });
    } catch (err) {
      console.warn('GovConAudit: failed to fetch audit trail', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="govcon-audit">
        <p style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="govcon-audit">
      <PolicyBanner
        policy="legal"
        context="govcon-audit"
        message="Audit trail records are maintained for DCAA review purposes. This does not constitute certified audit documentation."
        dismissible
      />

      <div className="gca-header">
        <h1 className="gca-title">Audit Trail</h1>
        <div className="gca-header-actions">
          <button className="gca-btn gca-btn-primary">
            <Download size={16} />
            Export for DCAA
          </button>
          <button className="gca-btn gca-btn-outline">
            <Shield size={16} />
            Verify Integrity
          </button>
        </div>
      </div>

      <div className="gca-kpi-grid">
        {kpis.map((kpi) => {
          const KpiIcon = iconMap[kpi.icon] ?? FileText;
          return (
            <div className="gca-kpi-card" key={kpi.label}>
              <div className="gca-kpi-icon">
                <KpiIcon size={20} />
              </div>
              <div className="gca-kpi-info">
                <span className="gca-kpi-value">{kpi.value}</span>
                <span className="gca-kpi-label">{kpi.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="gca-main-grid">
        <div className="gca-timeline-section">
          <h2 className="gca-section-title">Recent Activity</h2>
          <div className="gca-timeline">
            {timelineEntries.map((entry, index) => {
              const EntryIcon = resolveIcon(entry._raw ?? entry);
              return (
                <div className="gca-timeline-entry" key={index}>
                  <div className={`gca-timeline-dot ${entry.recent ? 'gca-dot-purple' : 'gca-dot-gray'}`} />
                  {index < timelineEntries.length - 1 && <div className="gca-timeline-line" />}
                  <div className="gca-timeline-card">
                    <div className="gca-timeline-card-header">
                      <div className="gca-timeline-icon">
                        <EntryIcon size={16} />
                      </div>
                      <span className="gca-timeline-date">{entry.date}</span>
                    </div>
                    <h3 className="gca-timeline-title">{entry.title}</h3>
                    <p className="gca-timeline-desc">{entry.description}</p>
                    <span className="gca-timeline-hash">
                      <Hash size={12} />
                      {entry.hash}
                    </span>
                  </div>
                </div>
              );
            })}
            {timelineEntries.length === 0 && (
              <p style={{ color: '#888', padding: '1rem' }}>No audit trail entries found.</p>
            )}
          </div>
        </div>

        <div className="gca-sidebar">
          <div className="gca-sidebar-card">
            <h3 className="gca-sidebar-title">Evidence Status</h3>
            <div className="gca-evidence-list">
              {evidenceItems.map((item) => (
                <div className="gca-evidence-item" key={item.label}>
                  <span className={`gca-evidence-dot gca-evidence-${item.color}`} />
                  <span className="gca-evidence-label">{item.label}</span>
                  <span className={`gca-evidence-status gca-evidence-${item.color}`}>{item.status}</span>
                </div>
              ))}
              {evidenceItems.length === 0 && (
                <p style={{ color: '#888' }}>No evidence data available.</p>
              )}
            </div>
          </div>

          <div className="gca-sidebar-card">
            <h3 className="gca-sidebar-title">DCAA Export History</h3>
            <div className="gca-export-list">
              <div className="gca-export-row">
                <span className="gca-export-label">Last export</span>
                <span className="gca-export-value">{exportHistory.lastExport}</span>
              </div>
              <div className="gca-export-row">
                <span className="gca-export-label">Format</span>
                <span className="gca-export-value">{exportHistory.format}</span>
              </div>
              <div className="gca-export-row">
                <span className="gca-export-label">Records</span>
                <span className="gca-export-value">{exportHistory.records}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
