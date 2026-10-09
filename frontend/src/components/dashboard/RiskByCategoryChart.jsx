import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function RiskByCategoryChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ left: 40 }}>
        <XAxis type="number" allowDecimals={false} />
        <YAxis type="category" dataKey="label" width={140} />
        <Tooltip />
        <Bar dataKey="value" fill="#3949ab" />
      </BarChart>
    </ResponsiveContainer>
  );
}