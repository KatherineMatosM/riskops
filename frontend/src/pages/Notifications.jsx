import { useNotifications } from "../hooks/useNotifications";
import NotificationItem from "../components/notifications/NotificationItem";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import ErrorState from "../components/common/ErrorState";
import Card from "../components/common/Card";
import PageHeader from "../components/common/PageHeader";
import { Bell } from "lucide-react";

export default function Notifications() {
  const { notifications, loading, error, markRead } = useNotifications();

  return (
    <div className="notifications-page">
      <PageHeader icon={Bell} title="Notificaciones" description="Consulta las novedades y los avisos que requieren tu atención." />
      <Card title="Centro de notificaciones" description={`${notifications.filter((item) => !item.is_read).length} notificaciones sin leer`}>
      {loading ? <LoadingState variant="list" rows={3} /> : error ? <ErrorState message={error} /> : notifications.length === 0 ? (
        <EmptyState message="No tienes notificaciones." />
      ) : (
        notifications.map((n) => (
          <NotificationItem key={n.id} notification={n} onMarkRead={markRead} />
        ))
      )}
      </Card>
    </div>
  );
}
