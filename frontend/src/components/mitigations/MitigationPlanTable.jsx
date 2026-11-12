import Table from "../common/Table";
import { formatDate, formatStatus } from "../../utils/formatters";

export default function MitigationPlanTable({ plans, onSelect }) {
  const columns = [
    { key: "title", label: "Título", render: (row) => <strong>{row.title}</strong> },
    { key: "status", label: "Estado", render: (row) => <span className={`status-badge status-${row.status.toLowerCase()}`}>{formatStatus(row.status)}</span> },
    { key: "progress", label: "Progreso", render: (row) => <div className="progress-cell"><span className="progress-track"><span style={{ width: `${Math.max(0, Math.min(100, row.progress))}%` }} /></span><span>{row.progress}%</span></div> },
    { key: "due_date", label: "Fecha límite", render: (row) => formatDate(row.due_date) },
  ];

  return <Table columns={columns} data={plans} onRowClick={onSelect} />;
}
