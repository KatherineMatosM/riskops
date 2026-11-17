import api from "./api";

beforeEach(() => { localStorage.clear(); window.history.replaceState({}, "", "/login"); });

test("authenticated requests carry the current token", () => {
  localStorage.setItem("riskops_token", "current");
  const config = api.interceptors.request.handlers[0].fulfilled({ headers: {} });
  expect(config.headers.Authorization).toBe("Bearer current");
});

test("a delayed 401 from an old session cannot erase the current session", async () => {
  localStorage.setItem("riskops_token", "current");
  localStorage.setItem("riskops_user", "current-user");
  const error = { response: { status: 401 }, config: { headers: { Authorization: "Bearer old" } } };
  await expect(api.interceptors.response.handlers[0].rejected(error)).rejects.toBe(error);
  expect(localStorage.getItem("riskops_token")).toBe("current");
  expect(localStorage.getItem("riskops_user")).toBe("current-user");
});

test("a 401 for the active session clears it and informs the mounted auth provider", async () => {
  localStorage.setItem("riskops_token", "current");
  localStorage.setItem("riskops_user", "current-user");
  const onExpired = jest.fn();
  window.addEventListener("riskops:session-expired", onExpired);
  const error = { response: { status: 401 }, config: { headers: { Authorization: "Bearer current" } } };
  try {
    await expect(api.interceptors.response.handlers[0].rejected(error)).rejects.toBe(error);
    expect(localStorage.getItem("riskops_token")).toBeNull();
    expect(localStorage.getItem("riskops_user")).toBeNull();
    expect(onExpired).toHaveBeenCalledTimes(1);
  } finally {
    window.removeEventListener("riskops:session-expired", onExpired);
  }
});
