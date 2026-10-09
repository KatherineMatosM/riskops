import api from "./api";

export async function getRisksReport(filters = {}) {
  const response = await api.get("/reports/risks", { params: filters });
  return response.data.data;
}

export async function getMitigationsReport() {
  const response = await api.get("/reports/mitigations");
  return response.data.data;
}

export async function getCriticalRisksReport() {
  const response = await api.get("/reports/critical-risks");
  return response.data.data;
}