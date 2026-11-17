import { MemoryRouter, useNavigate } from "react-router-dom";
import Login from "./Login";
import { useAuth } from "../hooks/useAuth";
import { change, render, submit } from "../testUtils";

jest.mock("../hooks/useAuth");
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));

const login = jest.fn();
const navigate = jest.fn();
const field = (view, name) => view.container.querySelector(`[name="${name}"]`);
const alert = (view) => view.container.querySelector('[role="alert"]');
const linkedError = (input) => document.getElementById(input.getAttribute("aria-describedby"));

async function renderLogin() {
  const view = await render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Login /></MemoryRouter>);
  await change(field(view, "email"), "user@example.com");
  await change(field(view, "password"), "test-password");
  return view;
}

beforeEach(() => {
  jest.clearAllMocks();
  useAuth.mockReturnValue({ login });
  useNavigate.mockReturnValue(navigate);
});

test("successful login submits the entered credentials and opens the dashboard", async () => {
  login.mockResolvedValueOnce({});
  const view = await renderLogin();
  await submit(view.container.querySelector("form"));
  expect(login).toHaveBeenCalledWith("user@example.com", "test-password");
  expect(navigate).toHaveBeenCalledWith("/dashboard");
  expect(alert(view)).toBeNull();
});

test.each([
  { code: "INVALID_CREDENTIALS", message: "Credenciales inválidas." },
  { code: "INVALID_CREDENTIALS" },
])("only an authentication rejection reports invalid credentials (%j)", async (data) => {
  login.mockRejectedValueOnce({ response: { status: 401, data } });
  const view = await renderLogin();
  await submit(view.container.querySelector("form"));
  expect(alert(view).textContent).toContain("Credenciales inválidas.");
  expect(navigate).not.toHaveBeenCalled();
});

test("a network failure asks the user to check the connection", async () => {
  login.mockRejectedValueOnce(new Error("Network Error"));
  const view = await renderLogin();
  await submit(view.container.querySelector("form"));
  expect(alert(view).textContent).toContain("No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.");
  expect(alert(view).textContent).not.toContain("Credenciales");
  expect(navigate).not.toHaveBeenCalled();
  expect(view.container.querySelector('button[type="submit"]').disabled).toBe(false);
});

test("a missing login endpoint reports service availability without exposing route details", async () => {
  login.mockRejectedValueOnce({ response: { status: 404, data: { detail: "Not Found", message: "POST /auth/login not found" } } });
  const view = await renderLogin();
  await submit(view.container.querySelector("form"));
  expect(alert(view).textContent).toBe("El servicio de acceso no está disponible. Inténtalo de nuevo más tarde.");
  expect(navigate).not.toHaveBeenCalled();
});

test.each([500, 503])("a %s server failure offers a retry without blaming the credentials", async (status) => {
  login.mockRejectedValueOnce({ response: { status, data: { message: "Credenciales inválidas." } } });
  const view = await renderLogin();
  await submit(view.container.querySelector("form"));
  expect(alert(view).textContent).toBe("No se pudo iniciar sesión por un problema del servidor. Inténtalo de nuevo más tarde.");
  expect(navigate).not.toHaveBeenCalled();
});

test("other HTTP failures use a neutral fallback", async () => {
  login.mockRejectedValueOnce({ response: { status: 400, data: { message: "Credenciales inválidas." } } });
  const view = await renderLogin();
  await submit(view.container.querySelector("form"));
  expect(alert(view).textContent).toBe("No se pudo iniciar sesión. Inténtalo de nuevo.");
  expect(navigate).not.toHaveBeenCalled();
});

test("validation errors remain linked to login fields and clear independently on edit", async () => {
  login.mockRejectedValueOnce({ response: { status: 422, data: {
    message: "Datos de entrada inválidos.",
    errors: [
      { field: "email", message: "Introduce un correo válido." },
      { field: "password", message: "Introduce una contraseña válida." },
      { field: "other", message: "No debe mostrarse." },
    ],
  } } });
  const view = await renderLogin();
  await submit(view.container.querySelector("form"));
  const email = field(view, "email"), password = field(view, "password");
  expect(alert(view).textContent).toBe("Datos de entrada inválidos.");
  expect(email.value).toBe("user@example.com");
  expect(password.value).toBe("test-password");
  expect(email.getAttribute("aria-invalid")).toBe("true");
  expect(password.getAttribute("aria-invalid")).toBe("true");
  expect(linkedError(email).textContent).toBe("Introduce un correo válido.");
  expect(linkedError(password).textContent).toBe("Introduce una contraseña válida.");
  expect(view.container.textContent).not.toContain("No debe mostrarse.");
  expect(navigate).not.toHaveBeenCalled();
  await change(email, "updated@example.com");
  expect(email.getAttribute("aria-invalid")).toBe("false");
  expect(password.getAttribute("aria-invalid")).toBe("true");
  expect(linkedError(password).textContent).toBe("Introduce una contraseña válida.");
});
