import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ShieldAlert } from "lucide-react";
import { riskLevelColor, riskLevelLabel } from "../../utils/riskLevelHelper";
import EmptyState from "../common/EmptyState";
import { TOOLTIP_STYLE } from "./chartTheme";

export default function RiskByLevelChart({ data }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (!total) return <EmptyState icon={ShieldAlert} message="No hay riesgos evaluados para mostrar." />;

  return (
    <div className="donut-layout">
      <div className="donut-chart" role="img" aria-label={`Distribución de ${total} riesgos por nivel`}>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius={66} outerRadius={92} paddingAngle={3} stroke="none">
              {data.map((entry) => <Cell key={entry.label} fill={riskLevelColor(entry.label)} />)}
            </Pie>
            <Tooltip {...TOOLTIP_STYLE} formatter={(value, name) => [value, riskLevelLabel(name)]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-center"><strong>{total}</strong><span>Riesgos</span></div>
      </div>
      <ul className="chart-legend">
        {data.map((entry) => <li key={entry.label} className="chart-legend-item">
          <span className="legend-dot" style={{ background: riskLevelColor(entry.label) }} />
          <span>{riskLevelLabel(entry.label)}</span><strong className="chart-legend-value">{entry.value}</strong>
        </li>)}
      </ul>
    </div>
  );
}
