import { ClipboardCheck } from "lucide-react";
import EmptyState from "../common/EmptyState";
import { chartLabel, CHART_COLORS } from "./chartTheme";

const STATUS_COLORS = { COMPLETED: "#28a580", IN_PROGRESS: "#2458d3", PLANNED: "#8a71d6", OVERDUE: "#dc3545", CANCELLED: "#8a99af" };

export default function MitigationStatusChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (!total) return <EmptyState icon={ClipboardCheck} message="No hay planes de mitigación para mostrar." />;

  return (
    <div className="mitigation-progress-list">
      {data.map((item, index) => {
        const percentage = Math.round((item.value / total) * 100);
        return <div className="mitigation-progress-row" key={item.label}>
          <div className="mitigation-progress-label"><span>{chartLabel(item.label)}</span><strong>{item.value} <small>({percentage}%)</small></strong></div>
          <div className="progress-track" role="progressbar" aria-label={chartLabel(item.label)} aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100}>
            <span className="progress-fill" style={{ width: `${percentage}%`, background: STATUS_COLORS[item.label] || CHART_COLORS[index % CHART_COLORS.length] }} />
          </div>
        </div>;
      })}
      <p className="chart-footnote">{total} {total === 1 ? "plan registrado" : "planes registrados"}</p>
    </div>
  );
}
