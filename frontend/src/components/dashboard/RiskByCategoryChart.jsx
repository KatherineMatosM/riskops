import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Layers } from "lucide-react";
import EmptyState from "../common/EmptyState";
import { AXIS_STYLE, TOOLTIP_STYLE } from "./chartTheme";

export default function RiskByCategoryChart({ data }) {
  if (!data.some((item) => item.value > 0)) return <EmptyState icon={Layers} message="No hay riesgos por categoría para mostrar." />;

  return (
    <div className="chart-visual" role="img" aria-label="Cantidad de riesgos por categoría">
      <ResponsiveContainer width="100%" height={Math.max(240, data.length * 44)}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 24, top: 12, bottom: 0 }} barCategoryGap="30%">
          <CartesianGrid stroke="#edf1f7" horizontal={false} />
          <XAxis type="number" allowDecimals={false} {...AXIS_STYLE} />
          <YAxis type="category" dataKey="label" width={112} {...AXIS_STYLE} tickFormatter={(value) => value.length > 17 ? `${value.slice(0, 16)}…` : value} />
          <Tooltip {...TOOLTIP_STYLE} formatter={(value) => [value, "Riesgos"]} />
          <Bar dataKey="value" name="Riesgos" fill="#2458d3" radius={[0, 5, 5, 0]} maxBarSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
