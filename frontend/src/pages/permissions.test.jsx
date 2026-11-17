import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Users from "./Users";
import Mitigations from "./Mitigations";
import * as userService from "../services/userService";
import * as riskService from "../services/riskService";
import { useMitigations } from "../hooks/useMitigations";
import { render } from "../testUtils";

jest.mock("../services/userService");
jest.mock("../services/riskService");
jest.mock("../hooks/useMitigations");
function screen(role, child) {
  const auth = { user: { id: 1, roles: [role] }, hasRole: (...roles) => roles.includes(role) };
  return <MemoryRouter initialEntries={["/mitigations?risk_id=9"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><AuthContext.Provider value={auth}>{child}</AuthContext.Provider></MemoryRouter>;
}
beforeEach(() => {
  jest.clearAllMocks();
  userService.listUsers.mockResolvedValue([]);
  userService.listAssignees.mockResolvedValue([{ id: 4, full_name: "Analista responsable" }]);
  riskService.getRisk.mockResolvedValue({ id: 9, title: "Riesgo" });
  useMitigations.mockReturnValue({ plans: [], loading: false, error: null, refresh: jest.fn() });
});

test("risk managers can read the directory without being offered administrator-only user creation", async () => {
  const { container } = await render(screen("RISK_MANAGER", <Users />));
  expect(userService.listUsers).toHaveBeenCalledTimes(1);
  expect(container.textContent).toContain("Directorio de usuarios");
  expect(container.textContent).not.toContain("Nuevo usuario");
});

test("administrators retain user creation controls", async () => {
  const { container } = await render(screen("ADMIN", <Users />));
  expect([...container.querySelectorAll("button")].some((button) => button.textContent.includes("Nuevo usuario"))).toBe(true);
});

test.each(["ADMIN", "RISK_MANAGER", "ANALYST"])("%s can select an assignee through the restricted minimal endpoint", async (role) => {
  const { container } = await render(screen(role, <Mitigations />));
  expect(userService.listAssignees).toHaveBeenCalledTimes(1);
  expect(userService.listUsers).not.toHaveBeenCalled();
  const select = container.querySelector('[name="responsible_user_id"]');
  expect([...select.options].map((option) => [option.value, option.textContent])).toContainEqual(["4", "Analista responsable"]);
});

test("viewers neither request the assignee list nor receive a plan creation form", async () => {
  const { container } = await render(screen("VIEWER", <Mitigations />));
  expect(userService.listAssignees).not.toHaveBeenCalled();
  expect(container.querySelector(".mitigation-plan-form")).toBeNull();
});
