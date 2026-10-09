import { ShieldAlert, Clock, UserPlus2, Bell } from "lucide-react";
import { formatDateTime } from "../../utils/formatters";

const TYPE_ICON = {
  RISK_CRITICAL: ShieldAlert,
  MITIGATION_DUE_SOON: Clock,
  MITIGATION_OVERDUE: Clock,
  RISK_ASSIGNED: UserPlus2,
};

export default function NotificationItem({ notification, onMarkRead }) {
  const Icon = TYPE_ICON[notification.type] || Bell;

  return (
    <div className={`notification-item${notification.is_read ? "" : " unread"}`}>
      <div className="notification-item-body">
        <Icon size={18} className="notification-icon" />
        <div>
          <strong>{notification.title}</strong>
          <p>{notification.message}</p>
          <span className="notification-date">{formatDateTime(notification.created_at)}</span>
        </div>
      </div>
      {!notification.is_read && (
        <button className="link-button" onClick={() => onMarkRead(notification.id)}>
          Marcar como leida
        </button>
      )}
    </div>
  );
}