import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Activity } from "lucide-react";
import EmptyState from "../common/EmptyState";
import { CHART_COLORS, TOOLTIP_STYLE, chartLabel } from "./chartTheme";

export default function RiskByStatusChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (!total) return <EmptyState icon={Activity} message="No hay riesgos por estado para mostrar." />;

  return (
    <div className="donut-layout">
      <div className="donut-chart" role="img" aria-label={`Distribución de ${total} riesgos por estado`}>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius={66} outerRadius={92} paddingAngle={3} stroke="none">
              {data.map((entry, index) => <Cell key={entry.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
            </Pie>
            <Tooltip {...TOOLTIP_STYLE} formatter={(value, name) => [value, chartLabel(name)]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center"><strong>{total}</strong><span>Riesgos</span></div>
      </div>
      <ul className="chart-legend">
        {data.map((entry, index) => <li className="chart-legend-item" key={entry.label}>
          <span className="legend-dot" style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} />
          <span>{chartLabel(entry.label)}</span><strong className="chart-legend-value">{entry.value}</strong>
        </li>)}
      </ul>
    </div>
  );
}
