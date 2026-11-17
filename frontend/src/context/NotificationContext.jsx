import { createContext, useState, useCallback, useEffect, useRef } from "react";
import * as notificationService from "../services/notificationService";
import { useAuth } from "../hooks/useAuth";

export const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [state, setState] = useState({ userId: null, notifications: [], loading: false, error: null });
  const requestVersion = useRef(0);
  const currentUserId = useRef(userId);
  currentUserId.current = userId;

  const refresh = useCallback(async () => {
    const version = ++requestVersion.current;
    if (!userId) {
      setState({ userId: null, notifications: [], loading: false, error: null });
      return;
    }
    setState((previous) => ({ userId, notifications: previous.userId === userId ? previous.notifications : [], loading: true, error: null }));
    try {
      const data = await notificationService.listNotifications();
      if (requestVersion.current === version) setState({ userId, notifications: data, loading: false, error: null });
    } catch (err) {
      if (requestVersion.current === version) setState({ userId, notifications: [], loading: false, error: err.response?.data?.message || "No se pudieron cargar las notificaciones." });
    }
  }, [userId]);

  useEffect(() => {
    refresh();
    return () => { requestVersion.current += 1; };
  }, [refresh]);

  const markRead = useCallback(async (id) => {
    await notificationService.markAsRead(id);
    if (currentUserId.current === userId) {
      setState((previous) => previous.userId === userId ? { ...previous, notifications: previous.notifications.map((notification) => notification.id === id ? { ...notification, is_read: true } : notification) } : previous);
    }
  }, [userId]);

  const { notifications, loading, error } = state.userId === userId
    ? state
    : { notifications: [], loading: Boolean(userId), error: null };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <NotificationContext.Provider value={{ notifications, loading, error, refresh, markRead, unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}
