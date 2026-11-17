import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000/api/v1",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("riskops_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const token = localStorage.getItem("riskops_token");
      const requestAuthorization = error.config?.headers?.Authorization;
      // An old request must not sign out a newer session that has already logged in.
      if (token && requestAuthorization === `Bearer ${token}`) {
        localStorage.removeItem("riskops_token");
        localStorage.removeItem("riskops_user");
        window.dispatchEvent(new Event("riskops:session-expired"));
        if (window.location.pathname !== "/login") window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
