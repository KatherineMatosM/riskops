import { act } from "react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import RiskEdit from "./RiskEdit";
import * as riskService from "../services/riskService";
import * as categoryService from "../services/riskCategoryService";
import { deferred, render } from "../testUtils";

jest.mock("../services/riskService");
jest.mock("../services/riskCategoryService");
let navigate;
function NavigationProbe() { navigate = useNavigate(); return null; }
function screen() {
  return <MemoryRouter initialEntries={["/risks/1/edit"]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <NavigationProbe /><Routes><Route path="/risks/:riskId/edit" element={<RiskEdit />} /></Routes>
  </MemoryRouter>;
}
beforeEach(() => { jest.clearAllMocks(); categoryService.listCategories.mockResolvedValue([{ id: 1, name: "Operativo" }]); });

test("moving between edit routes replaces the form values instead of editing the previous risk", async () => {
  riskService.getRisk.mockImplementation(async (id) => ({ id, title: `Riesgo ${id}`, category_id: 1 }));
  const { container } = await render(screen());
  expect(container.querySelector('[name="title"]').value).toBe("Riesgo 1");
  await act(async () => { navigate("/risks/2/edit"); });
  expect(container.querySelector('[name="title"]').value).toBe("Riesgo 2");
});

test("a late first-risk request cannot overwrite the current risk's edit form", async () => {
  const first = deferred();
  riskService.getRisk.mockReturnValueOnce(first.promise).mockResolvedValueOnce({ id: 2, title: "Riesgo actual", category_id: 1 });
  const { container } = await render(screen());
  await act(async () => { navigate("/risks/2/edit"); });
  await act(async () => { first.resolve({ id: 1, title: "Riesgo anterior", category_id: 1 }); });
  expect(container.querySelector('[name="title"]').value).toBe("Riesgo actual");
});
