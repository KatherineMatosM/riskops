import { useNavigate } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import Table from "../common/Table";
import { riskLevelColor, riskLevelLabel } from "../../utils/riskLevelHelper";
import { formatStatus } from "../../utils/formatters";

export default function RiskTable({ risks }) {
  const navigate = useNavigate();

  const columns = [
    { key: "title", label: "Titulo" },
    { key: "status", label: "Estado", render: (row) => formatStatus(row.status) },
    {
      key: "risk_level",
      label: "Nivel",
      render: (row) => (
        <span className="risk-level-badge" style={{ backgroundColor: riskLevelColor(row.risk_level) }}>
          {row.risk_level === "CRITICAL" && <ShieldAlert size={12} />}
          {riskLevelLabel(row.risk_level)}
        </span>
      ),
    },
    { key: "risk_score", label: "Puntuacion", render: (row) => row.risk_score ?? "-" },
  ];

  return <Table columns={columns} data={risks} onRowClick={(row) => navigate(`/risks/${row.id}`)} />;
}