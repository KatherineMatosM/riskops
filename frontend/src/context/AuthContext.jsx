import { createContext, useState, useEffect, useCallback } from "react";
import * as authService from "../services/authService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("riskops_user");
    const token = localStorage.getItem("riskops_token");
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password);
    localStorage.setItem("riskops_token", data.access_token);
    localStorage.setItem("riskops_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("riskops_token");
    localStorage.removeItem("riskops_user");
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (...roles) => !!user && roles.some((role) => user.roles.includes(role)),
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}