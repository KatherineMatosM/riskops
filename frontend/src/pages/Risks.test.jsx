import { act } from "react";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useRisks } from "../hooks/useRisks";
import * as categoryService from "../services/riskCategoryService";
import Risks from "./Risks";
import { change, render } from "../testUtils";

jest.mock("../hooks/useRisks");
jest.mock("../services/riskCategoryService");
let filters, navigate, location;
function NavigationProbe() { navigate = useNavigate(); location = useLocation(); return null; }
async function renderRoute(query) {
  return render(<MemoryRouter initialEntries={[`/risks${query}`]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <AuthContext.Provider value={{ user: { id: 1, roles: ["VIEWER"] }, hasRole: () => false }}>
      <NavigationProbe /><Routes><Route path="/risks" element={<Risks />} /></Routes>
    </AuthContext.Provider>
  </MemoryRouter>);
}
beforeEach(() => {
  jest.clearAllMocks();
  categoryService.listCategories.mockResolvedValue([]);
  useRisks.mockImplementation((current) => {
    filters = current;
    return { risks: [], loading: false, error: null, pagination: { total: 50, page: current.page, page_size: 20, total_pages: 3 } };
  });
});

test("a matrix link sends its exact cell axes to the risk API query", async () => {
  const { container } = await renderRoute("?probability=5&impact=4");
  expect(filters).toEqual(expect.objectContaining({ page: 1, probability: 5, impact: 4 }));
  expect(container.textContent).toContain("Filtro de matriz: probabilidad 5 · impacto 4");
});

test("ordinary filter changes preserve the selected matrix cell", async () => {
  const view = await renderRoute("?probability=5&impact=4");
  await change(view.container.querySelector('input[placeholder="Buscar riesgo..."]'), "servidor");
  expect(filters).toEqual(expect.objectContaining({ search: "servidor", page: 1, probability: 5, impact: 4 }));
});

test("a different matrix URL replaces the cell and resets pagination", async () => {
  const view = await renderRoute("?probability=5&impact=4");
  await act(async () => { [...view.container.querySelectorAll("button")].find((button) => button.textContent.includes("Siguiente")).click(); });
  expect(filters.page).toBe(2);
  await act(async () => { navigate("/risks?probability=2&impact=3"); });
  expect(filters).toEqual(expect.objectContaining({ page: 1, probability: 2, impact: 3 }));
});

test("clearing the visible matrix filter removes the axes from both query and URL", async () => {
  const view = await renderRoute("?probability=5&impact=4");
  await act(async () => { [...view.container.querySelectorAll("button")].find((button) => button.textContent.includes("Quitar filtro de matriz")).click(); });
  expect(filters.probability).toBeUndefined();
  expect(filters.impact).toBeUndefined();
  expect(filters.page).toBe(1);
  expect(location.search).toBe("");
  expect(view.container.textContent).not.toContain("Filtro de matriz:");
});

test("invalid or out-of-range URL axes are never sent as matrix filters", async () => {
  const { container } = await renderRoute("?probability=6&impact=invalid");
  expect(filters.probability).toBeUndefined();
  expect(filters.impact).toBeUndefined();
  expect(container.textContent).not.toContain("Filtro de matriz:");
});

test("a valid single axis remains usable while an invalid counterpart is ignored", async () => {
  await renderRoute("?probability=2&impact=0");
  expect(filters.probability).toBe(2);
  expect(filters.impact).toBeUndefined();
});
