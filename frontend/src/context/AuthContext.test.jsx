import { act } from "react";
import { AuthProvider } from "./AuthContext";
import { useAuth } from "../hooks/useAuth";
import * as authService from "../services/authService";
import { deferred, render } from "../testUtils";

jest.mock("../services/authService");
let auth;
const verifiedUser = { id: 1, full_name: "Usuario", roles: ["VIEWER"] };
function Probe() { auth = useAuth(); return <output>{auth.loading ? "loading" : auth.user?.full_name || "signed out"}</output>; }
const screen = <AuthProvider><Probe /></AuthProvider>;

beforeEach(() => { localStorage.clear(); jest.clearAllMocks(); });

test("a missing token finishes loading without trusting a cached user", async () => {
  localStorage.setItem("riskops_user", JSON.stringify({ roles: ["ADMIN"] }));
  await render(screen);
  expect(authService.getMe).not.toHaveBeenCalled();
  expect(auth.user).toBeNull();
  expect(auth.loading).toBe(false);
  expect(localStorage.getItem("riskops_user")).toBeNull();
});

test("corrupt user cache is recovered from the authenticated backend", async () => {
  localStorage.setItem("riskops_token", "stored-token");
  localStorage.setItem("riskops_user", "{invalid-json");
  authService.getMe.mockResolvedValue(verifiedUser);
  await render(screen);
  expect(auth.user).toEqual(verifiedUser);
  expect(auth.loading).toBe(false);
  expect(auth.hasRole("ADMIN")).toBe(false);
  expect(auth.hasRole("VIEWER")).toBe(true);
  expect(JSON.parse(localStorage.getItem("riskops_user"))).toEqual(verifiedUser);
});

test("cached elevated roles are replaced by current backend permissions", async () => {
  localStorage.setItem("riskops_token", "stored-token");
  localStorage.setItem("riskops_user", JSON.stringify({ ...verifiedUser, roles: ["ADMIN"] }));
  authService.getMe.mockResolvedValue(verifiedUser);
  await render(screen);
  expect(auth.hasRole("ADMIN")).toBe(false);
});

test("an expired or rejected session clears both stored credentials", async () => {
  localStorage.setItem("riskops_token", "expired");
  localStorage.setItem("riskops_user", JSON.stringify(verifiedUser));
  authService.getMe.mockRejectedValue({ response: { status: 401 } });
  await render(screen);
  expect(auth.user).toBeNull();
  expect(auth.loading).toBe(false);
  expect(localStorage.getItem("riskops_token")).toBeNull();
  expect(localStorage.getItem("riskops_user")).toBeNull();
});

test("a late session restoration cannot undo logout", async () => {
  const pending = deferred();
  localStorage.setItem("riskops_token", "old");
  authService.getMe.mockReturnValue(pending.promise);
  await render(screen);
  expect(auth.loading).toBe(true);
  await act(async () => { auth.logout(); pending.resolve(verifiedUser); });
  expect(auth.user).toBeNull();
  expect(auth.loading).toBe(false);
  expect(localStorage.getItem("riskops_token")).toBeNull();
});

test("login stores the backend session and a late old restoration cannot replace it", async () => {
  const pending = deferred();
  const newUser = { id: 2, full_name: "Nueva sesión", roles: ["ANALYST"] };
  localStorage.setItem("riskops_token", "old");
  authService.getMe.mockReturnValue(pending.promise);
  authService.login.mockResolvedValue({ access_token: "new", user: newUser });
  await render(screen);
  await act(async () => { await auth.login("user@example.com", "password"); pending.resolve(verifiedUser); });
  expect(auth.user).toEqual(newUser);
  expect(auth.loading).toBe(false);
  expect(localStorage.getItem("riskops_token")).toBe("new");
});

test("missing roles fail closed without crashing and session-expired logs out", async () => {
  await render(screen);
  await act(async () => { auth.setUser({ id: 1 }); });
  expect(auth.hasRole("ADMIN")).toBe(false);
  await act(async () => { window.dispatchEvent(new Event("riskops:session-expired")); });
  expect(auth.user).toBeNull();
});
