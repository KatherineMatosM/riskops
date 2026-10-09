import api from "./api";

export async function login(email, password) {
  const response = await api.post("/auth/login", { email, password });
  return response.data.data;
}

export async function register(fullName, email, password) {
  const response = await api.post("/auth/register", { full_name: fullName, email, password });
  return response.data.data;
}

export async function getMe() {
  const response = await api.get("/auth/me");
  return response.data.data;
}

export async function changePassword(currentPassword, newPassword) {
  const response = await api.post("/auth/change-password", {
    current_password: currentPassword,
    new_password: newPassword,
  });
  return response.data.data;
}