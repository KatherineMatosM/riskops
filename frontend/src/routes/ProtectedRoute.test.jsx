import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { ProtectedRoute } from "./ProtectedRoute";
import { render } from "../testUtils";

async function renderRoute(auth, roles) {
  return render(<MemoryRouter initialEntries={["/private"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <AuthContext.Provider value={auth}><Routes>
      <Route path="/private" element={<ProtectedRoute roles={roles}><p>Contenido privado</p></ProtectedRoute>} />
      <Route path="/login" element={<p>Destino inicio de sesión</p>} />
      <Route path="/dashboard" element={<p>Destino dashboard</p>} />
    </Routes></AuthContext.Provider>
  </MemoryRouter>);
}

test("loading does not expose private content or redirect before session verification", async () => {
  const { container } = await renderRoute({ user: null, loading: true });
  expect(container.querySelector('[role="status"]').textContent).toContain("Cargando RiskOps");
  expect(container.textContent).not.toContain("Contenido privado");
  expect(container.textContent).not.toContain("Destino");
});

test("a signed-out visitor is redirected to login", async () => {
  const { container } = await renderRoute({ user: null, loading: false });
  expect(container.textContent).toBe("Destino inicio de sesión");
});

test("a user without the required role returns to the dashboard", async () => {
  const { container } = await renderRoute({ user: { id: 1 }, loading: false, hasRole: () => false }, ["ADMIN"]);
  expect(container.textContent).toBe("Destino dashboard");
});

test("any authorized role can access the protected content", async () => {
  const { container } = await renderRoute({ user: { id: 1 }, loading: false, hasRole: (...roles) => roles.includes("ANALYST") }, ["ADMIN", "ANALYST"]);
  expect(container.textContent).toBe("Contenido privado");
});
