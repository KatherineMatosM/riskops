import api from "./api";

export async function listPlansByRisk(riskId) {
  const response = await api.get(`/risks/${riskId}/mitigation-plans`);
  return response.data.data;
}

export async function getPlan(planId) {
  const response = await api.get(`/mitigation-plans/${planId}`);
  return response.data.data;
}

export async function createPlan(riskId, payload) {
  const response = await api.post(`/risks/${riskId}/mitigation-plans`, payload);
  return response.data.data;
}

export async function updatePlan(planId, payload) {
  const response = await api.put(`/mitigation-plans/${planId}`, payload);
  return response.data.data;
}

export async function deletePlan(planId) {
  const response = await api.delete(`/mitigation-plans/${planId}`);
  return response.data.data;
}