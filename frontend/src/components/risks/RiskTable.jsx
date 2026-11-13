import { useNavigate } from "react-router-dom";
import { Eye, Pencil } from "lucide-react";
import Table from "../common/Table";
import { useAuth } from "../../hooks/useAuth";
import { ROLES } from "../../utils/constants";
import RiskLevelBadge from "../common/RiskLevelBadge";
import { formatStatus } from "../../utils/formatters";

export default function RiskTable({ risks }) {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const canManage = hasRole(ROLES.ADMIN, ROLES.RISK_MANAGER, ROLES.ANALYST);

  const columns = [
    { key: "title", label: "Título", render: (row) => <strong className="table-primary-text">{row.title}</strong> },
    { key: "status", label: "Estado", render: (row) => <span className={`status-badge status-${row.status?.toLowerCase()}`}>{formatStatus(row.status)}</span> },
    {
      key: "risk_level",
      label: "Nivel",
      render: (row) => <RiskLevelBadge level={row.risk_level} />,
    },
    { key: "risk_score", label: "Puntuación", render: (row) => <span className="score-value">{row.risk_score ?? "—"}</span> },
    {
      key: "actions",
      label: "Acciones",
      render: (row) => (
        <div className="table-actions" onClick={(event) => event.stopPropagation()}>
          <button className="icon-button" type="button" aria-label={`Ver ${row.title}`} title="Ver riesgo" onClick={() => navigate(`/risks/${row.id}`)}><Eye size={17} /></button>
          {canManage && <button className="icon-button" type="button" aria-label={`Editar ${row.title}`} title="Editar riesgo" onClick={() => navigate(`/risks/${row.id}/edit`)}><Pencil size={17} /></button>}
        </div>
      ),
    },
  ];

  return <Table columns={columns} data={risks} onRowClick={(row) => navigate(`/risks/${row.id}`)} />;
}
