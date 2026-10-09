import api from "./api";

export async function listCategories() {
  const response = await api.get("/risk-categories");
  return response.data.data;
}

export async function createCategory(payload) {
  const response = await api.post("/risk-categories", payload);
  return response.data.data;
}

export async function updateCategory(categoryId, payload) {
  const response = await api.put(`/risk-categories/${categoryId}`, payload);
  return response.data.data;
}

export async function deleteCategory(categoryId) {
  const response = await api.delete(`/risk-categories/${categoryId}`);
  return response.data.data;
}