// Phase 40–41 — Intelligence types (frontend contract layer)

export type AlertStatus = "new" | "in_review" | "resolved";
export type AlertKind =
  | "anomaly"
  | "duplicate_charge"
  | "vendor_risk"
  | "compliance"
  | "cash_flow";

export type AlertItem = {
  id: string;
  title: string;
  summary: string;
  kind: AlertKind;
  status: AlertStatus;
  confidence: number; // 0..1
  created_at: string; // ISO8601
};

export type AlertsResponse = {
  generated_at: string; // ISO8601
  items: AlertItem[];
};

export type WorkerTaskStatus = "queued" | "running" | "blocked" | "complete";
export type WorkerTask = {
  id: string;
  title: string;
  summary: string;
  status: WorkerTaskStatus;
  confidence: number; // 0..1 (task relevance/priority confidence)
  created_at: string; // ISO8601
};

export type WorkerTasksResponse = {
  generated_at: string; // ISO8601
  items: WorkerTask[];
};
