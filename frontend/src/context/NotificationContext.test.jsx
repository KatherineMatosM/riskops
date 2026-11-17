import { act } from "react";
import { AuthContext } from "./AuthContext";
import { NotificationProvider } from "./NotificationContext";
import { useNotifications } from "../hooks/useNotifications";
import * as notificationService from "../services/notificationService";
import { deferred, render } from "../testUtils";

jest.mock("../services/notificationService");
let notifications;
function Probe() { notifications = useNotifications(); return <output>{notifications.unreadCount}</output>; }
function screen(user) { return <AuthContext.Provider value={{ user }}><NotificationProvider><Probe /></NotificationProvider></AuthContext.Provider>; }
const unread = { id: 7, title: "Aviso", is_read: false };
beforeEach(() => { jest.clearAllMocks(); notificationService.listNotifications.mockResolvedValue([unread]); });

test("notifications are fetched after login rather than only on the initial mount", async () => {
  const view = await render(screen(null));
  expect(notificationService.listNotifications).not.toHaveBeenCalled();
  await view.rerender(screen({ id: 1 }));
  expect(notificationService.listNotifications).toHaveBeenCalledTimes(1);
  expect(notifications.notifications).toEqual([unread]);
  expect(notifications.unreadCount).toBe(1);
});

test("logout clears private notifications and ignores a late response", async () => {
  const pending = deferred();
  notificationService.listNotifications.mockReturnValue(pending.promise);
  const view = await render(screen({ id: 1 }));
  await view.rerender(screen(null));
  expect(notifications.notifications).toEqual([]);
  expect(notifications.loading).toBe(false);
  await act(async () => { pending.resolve([unread]); });
  expect(notifications.notifications).toEqual([]);
  expect(notifications.unreadCount).toBe(0);
});

test("an earlier account response cannot replace the current account data", async () => {
  const first = deferred();
  const current = { id: 8, title: "Cuenta actual", is_read: true };
  notificationService.listNotifications.mockReturnValueOnce(first.promise).mockResolvedValueOnce([current]);
  const view = await render(screen({ id: 1 }));
  await view.rerender(screen({ id: 2 }));
  await act(async () => { first.resolve([unread]); });
  expect(notifications.notifications).toEqual([current]);
});

test("marking read updates the unread count only after API success", async () => {
  notificationService.markAsRead.mockResolvedValue({});
  await render(screen({ id: 1 }));
  await act(async () => { await notifications.markRead(7); });
  expect(notificationService.markAsRead).toHaveBeenCalledWith(7);
  expect(notifications.unreadCount).toBe(0);
});

test("failed marking leaves the notification unread and exposes the failure to the item", async () => {
  notificationService.markAsRead.mockRejectedValue(new Error("offline"));
  await render(screen({ id: 1 }));
  await act(async () => { await expect(notifications.markRead(7)).rejects.toThrow("offline"); });
  expect(notifications.unreadCount).toBe(1);
});

test("a failed fetch finishes loading with the backend message", async () => {
  notificationService.listNotifications.mockRejectedValue({ response: { data: { message: "Sesión sin acceso." } } });
  await render(screen({ id: 1 }));
  expect(notifications.loading).toBe(false);
  expect(notifications.error).toBe("Sesión sin acceso.");
});
