export const CHART_COLORS = ["#2458d3", "#28a580", "#e8a23c", "#8a71d6", "#6b86aa"];

export const AXIS_STYLE = { tick: { fill: "#75839a", fontSize: 12 }, axisLine: false, tickLine: false };

export const TOOLTIP_STYLE = {
  contentStyle: { borderRadius: 10, border: "1px solid #e2e8f0", boxShadow: "0 6px 24px #18315a12", fontSize: 13 },
  labelStyle: { color: "#172b4d", fontWeight: 600 },
  cursor: { fill: "#f2f6fd" },
};

const STATUS_LABELS = {
  IDENTIFIED: "Identificado", ASSESSED: "Evaluado", MITIGATION_IN_PROGRESS: "En mitigación",
  MONITORED: "En seguimiento", CLOSED: "Cerrado", PLANNED: "Planificado", IN_PROGRESS: "En progreso",
  COMPLETED: "Completado", CANCELLED: "Cancelado", OVERDUE: "Atrasado",
};

export function chartLabel(value) {
  return STATUS_LABELS[value] || value;
}
