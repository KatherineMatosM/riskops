import api from "./api";

export async function listEvaluations(riskId) {
  const response = await api.get(`/risks/${riskId}/evaluations`);
  return response.data.data;
}

export async function evaluateRisk(riskId, payload) {
  const response = await api.post(`/risks/${riskId}/evaluations`, payload);
  return response.data.data;
}