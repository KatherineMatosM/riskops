import { CircleCheck, CircleDashed, CircleDot, CircleX } from "lucide-react";
import { formatDate, formatStatus } from "../../utils/formatters";

const STATUS_ICON = {
  PENDING: CircleDashed,
  IN_PROGRESS: CircleDot,
  COMPLETED: CircleCheck,
  CANCELLED: CircleX,
};

export default function MitigationActionList({ actions }) {
  if (!actions.length) {
    return <p className="empty-state">Este plan no tiene acciones registradas.</p>;
  }

  return (
    <ul className="action-list">
      {actions.map((action) => {
        const Icon = STATUS_ICON[action.status] || CircleDashed;
        return (
          <li key={action.id} className="action-list-item">
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <Icon size={16} style={{ marginTop: "0.2rem" }} />
              <div>
                <strong>{action.title}</strong>
                <p>{action.description}</p>
              </div>
            </div>
            <div className="action-list-meta">
              <span>{formatStatus(action.status)}</span>
              <span>Vence: {formatDate(action.due_date)}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}