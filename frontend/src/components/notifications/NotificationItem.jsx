import { useState } from "react";
import { ShieldAlert, Clock, UserPlus2, Bell, CheckCheck, Loader2 } from "lucide-react";
import { formatDateTime } from "../../utils/formatters";
import Alert from "../common/Alert";

const TYPE_ICON = {
  RISK_CRITICAL: ShieldAlert,
  MITIGATION_DUE_SOON: Clock,
  MITIGATION_OVERDUE: Clock,
  RISK_ASSIGNED: UserPlus2,
};

export default function NotificationItem({ notification, onMarkRead }) {
  const Icon = TYPE_ICON[notification.type] || Bell;
  const [markingRead, setMarkingRead] = useState(false);
  const [error, setError] = useState(null);

  async function handleMarkRead() {
    setMarkingRead(true);
    setError(null);
    try {
      await onMarkRead(notification.id);
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo marcar la notificación como leída.");
    } finally {
      setMarkingRead(false);
    }
  }

  return (
    <div className={`notification-item${notification.is_read ? "" : " unread"}`}>
      <div className="notification-item-body">
        <span className="notification-icon"><Icon size={20} aria-hidden="true" /></span>
        <div>
          <strong>{notification.title}</strong>
          <p>{notification.message}</p>
          <span className="notification-date">{formatDateTime(notification.created_at)}</span>
          {error && <Alert type="error" message={error} />}
        </div>
      </div>
      {!notification.is_read && (
        <button className="secondary-button button-with-icon" onClick={handleMarkRead} disabled={markingRead} aria-label={`Marcar como leída: ${notification.title}`}>
          {markingRead ? <Loader2 size={16} className="spin" /> : <CheckCheck size={16} />} {markingRead ? "Guardando..." : "Marcar como leída"}
        </button>
      )}
    </div>
  );
}
