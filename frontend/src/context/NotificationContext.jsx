import { createContext, useState, useCallback, useEffect } from "react";
import * as notificationService from "../services/notificationService";

export const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationService.listNotifications();
      setNotifications(data);
    } catch (err) {
      setError(err.response?.data?.message || "No se pudieron cargar las notificaciones.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("riskops_token");
    if (token) {
      refresh();
    }
  }, [refresh]);

  const markRead = useCallback(async (id) => {
    await notificationService.markAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <NotificationContext.Provider value={{ notifications, loading, error, refresh, markRead, unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}
