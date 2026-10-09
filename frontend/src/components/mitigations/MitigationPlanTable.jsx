import Table from "../common/Table";
import { formatDate, formatStatus } from "../../utils/formatters";

export default function MitigationPlanTable({ plans, onSelect }) {
  const columns = [
    { key: "title", label: "Titulo" },
    { key: "status", label: "Estado", render: (row) => formatStatus(row.status) },
    { key: "progress", label: "Progreso", render: (row) => `${row.progress}%` },
    { key: "due_date", label: "Fecha limite", render: (row) => formatDate(row.due_date) },
  ];

  return <Table columns={columns} data={plans} onRowClick={onSelect} />;
}