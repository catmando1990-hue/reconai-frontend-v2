import GovConKPIEmptyState from "./GovConKPIEmptyState";

const KPIS = [
  { title: "Active Contracts", description: "Tracked government contracts." },
  {
    title: "Indirect Rate Status",
    description: "Calculated indirect cost rates.",
  },
  { title: "Audit Readiness", description: "DCAA readiness posture." },
  {
    title: "Last Compliance Check",
    description: "Most recent compliance review.",
  },
];

export default function GovConKPIs() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {KPIS.map((kpi) => (
        <GovConKPIEmptyState key={kpi.title} {...kpi} />
      ))}
    </div>
  );
}
