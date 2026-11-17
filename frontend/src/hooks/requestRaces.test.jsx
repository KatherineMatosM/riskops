import { act } from "react";
import { useRisks } from "./useRisks";
import { useMitigations } from "./useMitigations";
import * as riskService from "../services/riskService";
import * as planService from "../services/mitigationPlanService";
import { deferred, render } from "../testUtils";

jest.mock("../services/riskService");
jest.mock("../services/mitigationPlanService");
let state;
function RisksProbe({ search }) { state = useRisks({ search, page: 1 }); return <output>{state.risks.map((item) => item.title).join(",")}</output>; }
function PlansProbe({ riskId }) { state = useMitigations(riskId); return <output>{state.plans.length}</output>; }
const result = (title) => ({ items: [{ id: 1, title }], total: 1, page: 1, page_size: 20, total_pages: 1 });
beforeEach(() => { jest.clearAllMocks(); });

test("an older search response cannot replace the latest filter results", async () => {
  const old = deferred(), current = deferred();
  riskService.listRisks.mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise);
  const view = await render(<RisksProbe search="old" />);
  await view.rerender(<RisksProbe search="current" />);
  await act(async () => { current.resolve(result("Actual")); });
  await act(async () => { old.resolve(result("Anterior")); });
  expect(state.risks[0].title).toBe("Actual");
  expect(state.loading).toBe(false);
});

test("an older request failure does not stop a newer search's loading state", async () => {
  const old = deferred(), current = deferred();
  riskService.listRisks.mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise);
  const view = await render(<RisksProbe search="old" />);
  await view.rerender(<RisksProbe search="current" />);
  await act(async () => { old.reject(new Error("old failure")); });
  expect(state.loading).toBe(true);
  expect(state.error).toBeNull();
  await act(async () => { current.resolve(result("Actual")); });
  expect(state.risks[0].title).toBe("Actual");
});

test("removing a risk clears plans, finishes loading, and discards its pending response", async () => {
  const pending = deferred();
  planService.listPlansByRisk.mockReturnValue(pending.promise);
  const view = await render(<PlansProbe riskId="1" />);
  await view.rerender(<PlansProbe riskId={null} />);
  expect(state.loading).toBe(false);
  expect(state.plans).toEqual([]);
  await act(async () => { pending.resolve([{ id: 4 }]); });
  expect(state.plans).toEqual([]);
});
