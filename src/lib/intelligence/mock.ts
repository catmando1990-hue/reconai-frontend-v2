// Phase 40–41 — Mock intelligence data
// Used when backend isn't wired; keeps UI logic real and deterministic.

import type {
  AlertsResponse,
  WorkerTasksResponse,
} from "@/lib/intelligence/types";

function isoNow() {
  return new Date().toISOString();
}

export function mockAlerts(): AlertsResponse {
  const now = isoNow();
  return {
    generated_at: now,
    items: [
      {
        id: "alt_001",
        title: "Potential duplicate charge requires review",
        summary:
          "Two transactions appear similar in merchant and amount. Confirm if one is a duplicate.",
        kind: "duplicate_charge",
        status: "new",
        confidence: 0.92,
        created_at: now,
      },
      {
        id: "alt_002",
        title:
          "Compliance signal: missing supporting note on flagged transaction",
        summary:
          "A transaction marked compliance-sensitive is missing supporting context. Add documentation to reduce audit risk.",
        kind: "compliance",
        status: "in_review",
        confidence: 0.78,
        created_at: now,
      },
      {
        id: "alt_003",
        title: "Vendor risk: new merchant appears with growing spend",
        summary:
          "A new vendor is trending upward over the last 14 days. Validate vendor legitimacy and categorize consistently.",
        kind: "vendor_risk",
        status: "new",
        confidence: 0.66,
        created_at: now,
      },
    ],
  };
}

export function mockWorkerTasks(): WorkerTasksResponse {
  const now = isoNow();
  return {
    generated_at: now,
    items: [
      {
        id: "tsk_001",
        title: "Review high-severity alerts (top 3)",
        summary:
          "Triage alerts by confidence and severity label. Confirm or dismiss.",
        status: "queued",
        confidence: 0.88,
        created_at: now,
      },
      {
        id: "tsk_002",
        title: "Propose vendor rule for recurring merchant",
        summary:
          "Suggest a classification rule based on recent merchant behavior and user history.",
        status: "running",
        confidence: 0.74,
        created_at: now,
      },
      {
        id: "tsk_003",
        title: "Assemble compliance note draft",
        summary:
          "Draft a short supporting note for a compliance-sensitive transaction for user approval.",
        status: "blocked",
        confidence: 0.61,
        created_at: now,
      },
    ],
  };
}
