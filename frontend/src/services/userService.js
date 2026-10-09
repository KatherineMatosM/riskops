import api from "./api";

export async function listUsers() {
  const response = await api.get("/users");
  return response.data.data;
}

export async function getUser(userId) {
  const response = await api.get(`/users/${userId}`);
  return response.data.data;
}

export async function createUser(payload) {
  const response = await api.post("/users", payload);
  return response.data.data;
}

export async function updateUser(userId, payload) {
  const response = await api.put(`/users/${userId}`, payload);
  return response.data.data;
}

export async function updateMyProfile(payload) {
  const response = await api.put("/users/me/profile", payload);
  return response.data.data;
}

export async function deleteUser(userId) {
  const response = await api.delete(`/users/${userId}`);
  return response.data.data;
}