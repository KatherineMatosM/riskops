import { CircleCheck, CircleDashed, CircleDot, CircleX } from "lucide-react";
import { formatDate, formatStatus } from "../../utils/formatters";
import EmptyState from "../common/EmptyState";

const STATUS_ICON = {
  PENDING: CircleDashed,
  IN_PROGRESS: CircleDot,
  COMPLETED: CircleCheck,
  CANCELLED: CircleX,
};

export default function MitigationActionList({ actions }) {
  if (!actions.length) {
    return <EmptyState message="Este plan no tiene acciones registradas." />;
  }

  return (
    <ul className="action-list">
      {actions.map((action) => {
        const Icon = STATUS_ICON[action.status] || CircleDashed;
        return (
          <li key={action.id} className="action-list-item">
            <div className="action-list-main">
              <Icon size={20} className="action-status-icon" />
              <div>
                <strong>{action.title}</strong>
                <p>{action.description}</p>
              </div>
            </div>
            <div className="action-list-meta">
              <span className={`status-badge status-${action.status.toLowerCase()}`}>{formatStatus(action.status)}</span>
              <span>Vence: {formatDate(action.due_date)}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
