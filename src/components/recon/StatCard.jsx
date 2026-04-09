import { Clock } from "lucide-react";
import "./StatCard.css";

export default function StatCard({ title, value, color, data }) {
  const maxValue = Math.max(...data);

  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-content">
        <h2 className="stat-value">{value}</h2>
        <p className="stat-title">{title}</p>
      </div>
      <div className="stat-chart">
        {data.map((val, index) => (
          <div
            key={index}
            className="stat-bar"
            style={{ height: `${(val / maxValue) * 100}%` }}
          />
        ))}
      </div>
      <div className="stat-footer">
        <Clock size={14} />
        <span>update : 2:15 am</span>
      </div>
    </div>
  );
}
