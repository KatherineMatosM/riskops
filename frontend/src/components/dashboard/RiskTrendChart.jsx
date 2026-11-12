import { useId } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Activity } from "lucide-react";
import EmptyState from "../common/EmptyState";
import { AXIS_STYLE, TOOLTIP_STYLE } from "./chartTheme";

export default function RiskTrendChart({ data }) {
  const gradientId = useId();
  if (!data.length) return <EmptyState icon={Activity} message="No hay datos históricos para mostrar." />;

  return (
    <div className="chart-visual" role="img" aria-label="Evolución temporal de los riesgos registrados">
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ left: -24, right: 16, top: 16, bottom: 0 }}>
          <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2458d3" stopOpacity={0.18} /><stop offset="100%" stopColor="#2458d3" stopOpacity={0.01} /></linearGradient></defs>
          <CartesianGrid stroke="#edf1f7" vertical={false} />
          <XAxis dataKey="label" {...AXIS_STYLE} dy={8} />
          <YAxis allowDecimals={false} {...AXIS_STYLE} />
          <Tooltip {...TOOLTIP_STYLE} formatter={(value) => [value, "Riesgos"]} />
          <Area type="monotone" dataKey="value" name="Riesgos" stroke="#2458d3" strokeWidth={2.5} fill={`url(#${gradientId})`} dot={{ r: 3, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
