import api from "./api";

export async function listRisks(filters = {}) {
  const response = await api.get("/risks", { params: filters });
  return response.data.data;
}

export async function getRisk(riskId) {
  const response = await api.get(`/risks/${riskId}`);
  return response.data.data;
}

export async function createRisk(payload) {
  const response = await api.post("/risks", payload);
  return response.data.data;
}

export async function updateRisk(riskId, payload) {
  const response = await api.put(`/risks/${riskId}`, payload);
  return response.data.data;
}

export async function deleteRisk(riskId) {
  const response = await api.delete(`/risks/${riskId}`);
  return response.data.data;
}