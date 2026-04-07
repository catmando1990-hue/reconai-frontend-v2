"use client";

import { AlertTriangle, CheckCircle, ClipboardCheck, List, XCircle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { govconApi } from '@/api';
import PolicyBanner from '@/components/recon/PolicyBanner';
import '@/styles/govcon/GovConSF1408.css';

const statusIcons = {
  documented: CheckCircle,
  'needs-review': AlertTriangle,
  partial: AlertTriangle,
  'not-addressed': XCircle,
};

export default function GovConSF1408() {
  const [sections, setSections] = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [nextSteps, setNextSteps] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [documented, setDocumented] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [complianceRes, mappingsRes] = await Promise.all([
        govconApi.getSF1408Compliance(),
        govconApi.getSF1408Mappings(),
      ]);

      const compliance = complianceRes.data ?? complianceRes;
      const mappings = mappingsRes.data ?? mappingsRes;

      // Normalize sections from compliance data
      const rawSections = compliance.sections ?? mappings.sections ?? [];
      const normalizedSections = rawSections.map((section) => ({
        title: section.title ?? section.name ?? '',
        items: (section.items ?? []).map((item) => ({
          description: item.description ?? item.name ?? '',
          status: item.status ?? 'Documented',
          statusKey: item.status_key ?? item.statusKey ?? (item.status ?? 'documented').toLowerCase().replace(/\s+/g, '-'),
        })),
      }));
      setSections(normalizedSections);

      // Compute summary from sections
      const allItems = normalizedSections.flatMap((s) => s.items);
      const total = allItems.length;
      const docCount = allItems.filter((i) => i.statusKey === 'documented').length;
      const needsReviewCount = allItems.filter((i) => i.statusKey === 'needs-review').length;
      const partialCount = allItems.filter((i) => i.statusKey === 'partial').length;
      const notAddressedCount = allItems.filter((i) => i.statusKey === 'not-addressed').length;

      setTotalItems(total);
      setDocumented(docCount);

      // Use backend summary if provided, otherwise compute
      const backendSummary = compliance.summary ?? mappings.summary ?? null;
      if (Array.isArray(backendSummary) && backendSummary.length > 0) {
        setSummaryData(
          backendSummary.map((s) => ({
            label: s.label ?? s.name ?? '',
            count: s.count ?? 0,
            statusKey: s.status_key ?? s.statusKey ?? (s.label ?? '').toLowerCase().replace(/\s+/g, '-'),
          }))
        );
      } else {
        setSummaryData([
          { label: 'Documented', count: docCount, statusKey: 'documented' },
          { label: 'Needs Review', count: needsReviewCount, statusKey: 'needs-review' },
          { label: 'Partial', count: partialCount, statusKey: 'partial' },
          { label: 'Not Addressed', count: notAddressedCount, statusKey: 'not-addressed' },
        ]);
      }

      // Next steps
      const steps = compliance.next_steps ?? compliance.nextSteps ?? mappings.next_steps ?? mappings.nextSteps ?? [];
      setNextSteps(steps.map((s) => (typeof s === 'string' ? s : s.description ?? s.text ?? '')));
    } catch (err) {
      console.warn('GovConSF1408: failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const percentage = totalItems > 0 ? ((documented / totalItems) * 100).toFixed(1) : '0.0';

  if (loading) {
    return (
      <div className="govcon-sf1408">
        <p style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div className="govcon-sf1408">
      <PolicyBanner
        policy="legal"
        context="govcon-sf1408"
        message="This SF-1408 checklist is a self-assessment tool. Official pre-award survey determination is made by the cognizant audit agency."
        dismissible
      />

      <div className="gcs-header">
        <div>
          <h1 className="gcs-title">SF-1408 Pre-Award Survey</h1>
          <p className="gcs-subtitle">Accounting System Adequacy Checklist</p>
        </div>
      </div>

      <div className="gcs-score-card">
        <div className="gcs-score-info">
          <div className="gcs-score-number">
            <span className="gcs-score-big">{documented}</span>
            <span className="gcs-score-sep">/</span>
            <span className="gcs-score-total">{totalItems}</span>
            <span className="gcs-score-label">items documented</span>
          </div>
          <span className="gcs-score-pct">{percentage}%</span>
        </div>
        <div className="gcs-progress-bar">
          <div className="gcs-progress-fill" style={{ width: `${percentage}%` }} />
        </div>
      </div>

      <div className="gcs-main-grid">
        <div className="gcs-checklist-section">
          {sections.map((section) => (
            <div className="gcs-section-card" key={section.title}>
              <h2 className="gcs-section-heading">{section.title}</h2>
              <div className="gcs-items-list">
                {section.items.map((item, idx) => {
                  const Icon = statusIcons[item.statusKey] ?? AlertTriangle;
                  return (
                    <div className="gcs-item" key={idx}>
                      <Icon size={18} className={`gcs-item-icon gcs-status-${item.statusKey}`} />
                      <span className="gcs-item-desc">{item.description}</span>
                      <span className={`gcs-item-status gcs-status-${item.statusKey}`}>{item.status}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          {sections.length === 0 && (
            <p style={{ color: '#888', padding: '1rem', textAlign: 'center' }}>No SF-1408 section data available.</p>
          )}
        </div>

        <div className="gcs-sidebar">
          <div className="gcs-sidebar-card">
            <h3 className="gcs-sidebar-title">
              <ClipboardCheck size={16} />
              Assessment Summary
            </h3>
            <div className="gcs-summary-grid">
              {summaryData.map((item) => (
                <div className="gcs-summary-item" key={item.label}>
                  <span className={`gcs-summary-count gcs-status-${item.statusKey}`}>{item.count}</span>
                  <span className="gcs-summary-label">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="gcs-sidebar-card">
            <h3 className="gcs-sidebar-title">
              <List size={16} />
              Next Steps
            </h3>
            <ul className="gcs-next-steps">
              {nextSteps.map((step, idx) => (
                <li className="gcs-step-item" key={idx}>
                  <span className="gcs-step-number">{idx + 1}</span>
                  {step}
                </li>
              ))}
              {nextSteps.length === 0 && (
                <li style={{ color: '#888' }}>No next steps defined.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
