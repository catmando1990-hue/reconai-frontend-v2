"use client";

export type ActivityLedgerEvent = {
  id: string;
  timestamp: string;
  source: "system" | "user" | "ai";
  confidence?: number;
  description: string;
};

export function ActivityLedger({ events }: { events: ActivityLedgerEvent[] }) {
  return (
    <div className="space-y-2">
      {events.map((e) => (
        <div key={e.id} className="rounded border p-3 text-sm">
          <div className="opacity-70">{e.timestamp}</div>
          <div>{e.description}</div>
          {typeof e.confidence === "number" && (
            <div className="opacity-60">
              Confidence: {Math.round(e.confidence * 100)}%
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
