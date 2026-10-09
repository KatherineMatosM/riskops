import api from "./api";

export async function getSummary() {
  const response = await api.get("/dashboard/summary");
  return response.data.data;
}

export async function getRisksByLevel() {
  const response = await api.get("/dashboard/risks-by-level");
  return response.data.data;
}

export async function getRisksByCategory() {
  const response = await api.get("/dashboard/risks-by-category");
  return response.data.data;
}

export async function getRisksByStatus() {
  const response = await api.get("/dashboard/risks-by-status");
  return response.data.data;
}

export async function getRiskTrend() {
  const response = await api.get("/dashboard/risk-trend");
  return response.data.data;
}

export async function getMitigationsByStatus() {
  const response = await api.get("/dashboard/mitigations-by-status");
  return response.data.data;
}

export async function getRiskMatrix() {
  const response = await api.get("/dashboard/risk-matrix");
  return response.data.data;
}