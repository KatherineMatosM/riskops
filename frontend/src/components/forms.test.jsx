import { MemoryRouter } from "react-router-dom";
import RiskForm from "./risks/RiskForm";
import MitigationPlanForm from "./mitigations/MitigationPlanForm";
import { change, render, submit } from "../testUtils";

const categories = [{ id: 1, name: "Operativo" }];
const users = [{ id: 2, full_name: "Responsable" }];
async function renderRisk(onSubmit, initialValues) {
  return render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><RiskForm categories={categories} initialValues={initialValues} onSubmit={onSubmit} /></MemoryRouter>);
}
const field = (view, name) => view.container.querySelector(`[name="${name}"]`);
const linkedError = (input) => document.getElementById(input.getAttribute("aria-describedby"));

test("required risk errors are associated with fields, focus the first, and clear independently", async () => {
  const onSubmit = jest.fn();
  const view = await renderRisk(onSubmit);
  await submit(view.container.querySelector("form"));
  const title = field(view, "title"), category = field(view, "category_id");
  expect(title.getAttribute("aria-invalid")).toBe("true");
  expect(linkedError(title).textContent).toMatch(/título/);
  expect(linkedError(category).textContent).toMatch(/categoría/);
  expect(document.activeElement).toBe(title);
  expect(onSubmit).not.toHaveBeenCalled();
  await change(title, "Riesgo registrado");
  expect(title.getAttribute("aria-invalid")).toBe("false");
  expect(category.getAttribute("aria-invalid")).toBe("true");
  await submit(view.container.querySelector("form"));
  expect(document.activeElement).toBe(category);
});

test("a new risk cannot submit half an assessment and submits both numeric axes when complete", async () => {
  const onSubmit = jest.fn().mockResolvedValue({});
  const view = await renderRisk(onSubmit);
  await change(field(view, "title"), "Riesgo evaluado");
  await change(field(view, "category_id"), "1");
  await change(field(view, "probability"), "4");
  await submit(view.container.querySelector("form"));
  expect(onSubmit).not.toHaveBeenCalled();
  expect(linkedError(field(view, "impact")).textContent).toMatch(/impacto/);
  await change(field(view, "impact"), "5");
  await submit(view.container.querySelector("form"));
  expect(onSubmit).toHaveBeenCalledWith({ title: "Riesgo evaluado", description: null, category_id: 1, probability: 4, impact: 5 });
  expect(view.container.textContent).toContain("Crítico");
});

test("an unassessed risk remains valid with both optional axes omitted", async () => {
  const onSubmit = jest.fn().mockResolvedValue({});
  const view = await renderRisk(onSubmit);
  await change(field(view, "title"), "Riesgo sin evaluar");
  await change(field(view, "category_id"), "1");
  await submit(view.container.querySelector("form"));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ probability: null, impact: null }));
});

test("editing keeps the backend's existing-axis merge contract", async () => {
  const onSubmit = jest.fn().mockResolvedValue({});
  const view = await renderRisk(onSubmit, { title: "Riesgo previo", category_id: 1, probability: 3, impact: 4 });
  await change(field(view, "probability"), "");
  await change(field(view, "impact"), "5");
  await submit(view.container.querySelector("form"));
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ probability: null, impact: 5 }));
});

test("backend field errors are displayed next to the actual risk input and retain form values", async () => {
  const onSubmit = jest.fn().mockRejectedValue({ response: { data: { message: "Datos de entrada inválidos.", errors: [{ field: "category_id", message: "La categoría indicada no existe." }] } } });
  const view = await renderRisk(onSubmit);
  await change(field(view, "title"), "Riesgo conservado");
  await change(field(view, "category_id"), "1");
  await submit(view.container.querySelector("form"));
  expect(field(view, "title").value).toBe("Riesgo conservado");
  expect(linkedError(field(view, "category_id")).textContent).toBe("La categoría indicada no existe.");
  expect(document.activeElement).toBe(field(view, "category_id"));
  expect(view.container.querySelector('[role="alert"]').textContent).toContain("Datos de entrada inválidos");
});

test("a mitigation cannot end before it starts; same-day plans remain allowed", async () => {
  const onSubmit = jest.fn().mockResolvedValue({});
  const view = await render(<MitigationPlanForm users={users} onSubmit={onSubmit} />);
  await change(field(view, "title"), "Plan de seguimiento");
  await change(field(view, "responsible_user_id"), "2");
  await change(field(view, "start_date"), "2026-11-15");
  await change(field(view, "due_date"), "2026-11-14");
  await submit(view.container.querySelector("form"));
  expect(onSubmit).not.toHaveBeenCalled();
  expect(linkedError(field(view, "due_date")).textContent).toMatch(/igual o posterior/);
  expect(document.activeElement).toBe(field(view, "due_date"));
  await change(field(view, "due_date"), "2026-11-15");
  await submit(view.container.querySelector("form"));
  expect(onSubmit).toHaveBeenCalledWith({ title: "Plan de seguimiento", description: null, responsible_user_id: 2, start_date: "2026-11-15", due_date: "2026-11-15" });
  expect(field(view, "title").value).toBe("");
});

test("mitigation assignee errors are linked and options cannot be submitted while loading", async () => {
  const onSubmit = jest.fn();
  const view = await render(<MitigationPlanForm users={[]} usersLoading onSubmit={onSubmit} />);
  expect(field(view, "responsible_user_id").disabled).toBe(true);
  expect(view.container.querySelector('button[type="submit"]').disabled).toBe(true);
  await view.rerender(<MitigationPlanForm users={users} onSubmit={onSubmit} />);
  expect(field(view, "responsible_user_id").disabled).toBe(false);
});
