"use client";

import PolicyBanner from "@/components/PolicyBanner";
import "@/styles/govcon/GovConSF1408.css";
import {
  AlertTriangle,
  CheckCircle,
  ClipboardCheck,
  List,
  XCircle,
} from "lucide-react";

const sections = [
  {
    title: "Section A: General Accounting System",
    items: [
      {
        description: "Segregation of direct & indirect costs",
        status: "Documented",
        statusKey: "documented",
      },
      {
        description: "Consistent allocation methods",
        status: "Documented",
        statusKey: "documented",
      },
      {
        description: "Adequate general ledger",
        status: "Documented",
        statusKey: "documented",
      },
      {
        description: "Chart of accounts mapped to FAR",
        status: "Needs Review",
        statusKey: "needs-review",
      },
    ],
  },
  {
    title: "Section B: Cost Accounting",
    items: [
      {
        description: "CAS-compliant cost accounting",
        status: "Documented",
        statusKey: "documented",
      },
      {
        description: "Job cost tracking system",
        status: "Documented",
        statusKey: "documented",
      },
      {
        description: "Accumulation of costs by contract",
        status: "Documented",
        statusKey: "documented",
      },
      {
        description: "Proper cost transfer controls",
        status: "Documented",
        statusKey: "documented",
      },
    ],
  },
  {
    title: "Section C: Timekeeping",
    items: [
      {
        description: "Daily time recording",
        status: "Documented",
        statusKey: "documented",
      },
      {
        description: "Supervisor approval process",
        status: "Partial",
        statusKey: "partial",
      },
      {
        description: "Floor checks documented",
        status: "Documented",
        statusKey: "documented",
      },
      {
        description: "Correction procedures",
        status: "Documented",
        statusKey: "documented",
      },
    ],
  },
  {
    title: "Section D: Billing & Indirect",
    items: [
      {
        description: "Progress billing procedures",
        status: "Documented",
        statusKey: "documented",
      },
      {
        description: "Indirect rate computation",
        status: "Documented",
        statusKey: "documented",
      },
      {
        description: "Provisional billing rates",
        status: "Documented",
        statusKey: "documented",
      },
      {
        description: "Unallowable cost exclusion",
        status: "Documented",
        statusKey: "documented",
      },
    ],
  },
];

const statusIcons = {
  documented: CheckCircle,
  "needs-review": AlertTriangle,
  partial: AlertTriangle,
  "not-addressed": XCircle,
};

const summaryData = [
  { label: "Documented", count: 14, statusKey: "documented" },
  { label: "Needs Review", count: 1, statusKey: "needs-review" },
  { label: "Partial", count: 1, statusKey: "partial" },
  { label: "Not Addressed", count: 0, statusKey: "not-addressed" },
];

const nextSteps = [
  "Complete chart of accounts mapping",
  "Formalize supervisor approval workflow",
  "Schedule internal review",
  "Prepare for DCAA walkthrough",
];

export default function GovConSF1408() {
  const totalItems = 16;
  const documented = 14;
  const percentage = ((documented / totalItems) * 100).toFixed(1);

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
          <div
            className="gcs-progress-fill"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="gcs-main-grid">
        <div className="gcs-checklist-section">
          {sections.map((section) => (
            <div className="gcs-section-card" key={section.title}>
              <h2 className="gcs-section-heading">{section.title}</h2>
              <div className="gcs-items-list">
                {section.items.map((item, idx) => {
                  const Icon = statusIcons[item.statusKey];
                  return (
                    <div className="gcs-item" key={idx}>
                      <Icon
                        size={18}
                        className={`gcs-item-icon gcs-status-${item.statusKey}`}
                      />
                      <span className="gcs-item-desc">{item.description}</span>
                      <span
                        className={`gcs-item-status gcs-status-${item.statusKey}`}
                      >
                        {item.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
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
                  <span
                    className={`gcs-summary-count gcs-status-${item.statusKey}`}
                  >
                    {item.count}
                  </span>
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
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
