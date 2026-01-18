export type Sf1408Item = {
  id: string;
  text: string;
};

export type Sf1408Section = {
  id: string;
  title: string;
  items: Sf1408Item[];
};

/**
 * SF-1408 (Preaward Survey of Prospective Contractor Accounting System)
 * High-level checklist representation for in-app viewing.
 *
 * NOTE: This is an informational checklist viewer (advisory-only).
 * It does not represent legal/accounting advice and does not auto-submit anything.
 */
export const SF1408_SECTIONS: Sf1408Section[] = [
  {
    id: "general",
    title: "General Accounting System Criteria",
    items: [
      {
        id: "gen-1",
        text: "Is the accounting system in operation and used for current contracts?",
      },
      {
        id: "gen-2",
        text: "Does the system provide reliable, timely information for management decision-making?",
      },
      {
        id: "gen-3",
        text: "Are accounting policies and procedures documented and consistently followed?",
      },
      {
        id: "gen-4",
        text: "Is there adequate segregation of duties (authorization, custody, recording, review)?",
      },
    ],
  },
  {
    id: "costs",
    title: "Direct / Indirect Costs & Accumulation",
    items: [
      {
        id: "cost-1",
        text: "Are costs accumulated by contract and by cost element (labor, materials, ODCs)?",
      },
      {
        id: "cost-2",
        text: "Are direct costs identified and recorded to final cost objectives?",
      },
      {
        id: "cost-3",
        text: "Are indirect costs accumulated in logical cost pools?",
      },
      {
        id: "cost-4",
        text: "Are indirect rates calculated consistently and supported by source records?",
      },
      {
        id: "cost-5",
        text: "Is there a process to identify and exclude unallowable costs per FAR Part 31?",
      },
    ],
  },
  {
    id: "labor",
    title: "Labor Charging & Timekeeping",
    items: [
      {
        id: "labor-1",
        text: "Is timekeeping performed by the employee and approved by appropriate supervision?",
      },
      {
        id: "labor-2",
        text: "Are labor hours recorded daily and charged to the correct cost objective?",
      },
      {
        id: "labor-3",
        text: "Are adjustments to time records controlled, documented, and approved?",
      },
      {
        id: "labor-4",
        text: "Are labor distribution reports reconciled to payroll and general ledger?",
      },
    ],
  },
  {
    id: "billing",
    title: "Billing, Invoicing, and Reconciliation",
    items: [
      {
        id: "bill-1",
        text: "Can the system produce billings that reconcile to the general ledger?",
      },
      {
        id: "bill-2",
        text: "Are billings supported by contract terms and documented source data?",
      },
      {
        id: "bill-3",
        text: "Are accounts receivable and cash receipts tracked and reconciled?",
      },
    ],
  },
  {
    id: "reporting",
    title: "Reporting & Audit Trail",
    items: [
      {
        id: "rep-1",
        text: "Is there an audit trail from source documents to general ledger and to reports?",
      },
      {
        id: "rep-2",
        text: "Can the system produce contract cost reports upon request?",
      },
      {
        id: "rep-3",
        text: "Are period close and adjustment processes controlled and documented?",
      },
    ],
  },
];
