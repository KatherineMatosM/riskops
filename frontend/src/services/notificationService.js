import api from "./api";

export async function listNotifications() {
  const response = await api.get("/notifications");
  return response.data.data;
}

export async function markAsRead(notificationId) {
  const response = await api.put(`/notifications/${notificationId}/read`);
  return response.data.data;
}