import api from "./api";

export async function listActionsByPlan(planId) {
  const response = await api.get(`/mitigation-plans/${planId}/actions`);
  return response.data.data;
}

export async function createAction(planId, payload) {
  const response = await api.post(`/mitigation-plans/${planId}/actions`, payload);
  return response.data.data;
}

export async function updateAction(actionId, payload) {
  const response = await api.put(`/mitigation-actions/${actionId}`, payload);
  return response.data.data;
}

export async function deleteAction(actionId) {
  const response = await api.delete(`/mitigation-actions/${actionId}`);
  return response.data.data;
}