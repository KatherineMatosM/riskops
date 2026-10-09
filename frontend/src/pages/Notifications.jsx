import { useNotifications } from "../hooks/useNotifications";
import NotificationItem from "../components/notifications/NotificationItem";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";

export default function Notifications() {
  const { notifications, loading, markRead } = useNotifications();

  if (loading) return <LoadingState />;

  return (
    <div className="notifications-page">
      <h2>Notificaciones</h2>
      {notifications.length === 0 ? (
        <EmptyState message="No tienes notificaciones." />
      ) : (
        notifications.map((n) => (
          <NotificationItem key={n.id} notification={n} onMarkRead={markRead} />
        ))
      )}
    </div>
  );
}