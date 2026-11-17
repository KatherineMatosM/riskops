import { createContext, useState, useEffect, useCallback, useRef } from "react";
import * as authService from "../services/authService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const sessionVersion = useRef(0);

  const logout = useCallback(() => {
    sessionVersion.current += 1;
    localStorage.removeItem("riskops_token");
    localStorage.removeItem("riskops_user");
    setUser(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("riskops_token");
    const version = ++sessionVersion.current;
    let active = true;
    if (!token) {
      localStorage.removeItem("riskops_user");
      setLoading(false);
    } else {
      authService.getMe().then((currentUser) => {
        if (!active || sessionVersion.current !== version || localStorage.getItem("riskops_token") !== token) return;
        localStorage.setItem("riskops_user", JSON.stringify(currentUser));
        setUser(currentUser);
      }).catch(() => {
        if (active && sessionVersion.current === version) logout();
      }).finally(() => {
        if (active && sessionVersion.current === version) setLoading(false);
      });
    }
    return () => { active = false; };
  }, [logout]);

  useEffect(() => {
    function handleStorage(event) {
      if (event.key === "riskops_token" && !event.newValue) logout();
    }
    window.addEventListener("riskops:session-expired", logout);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("riskops:session-expired", logout);
      window.removeEventListener("storage", handleStorage);
    };
  }, [logout]);

  const login = useCallback(async (email, password) => {
    const version = ++sessionVersion.current;
    try {
      const data = await authService.login(email, password);
      if (sessionVersion.current === version) {
        localStorage.setItem("riskops_token", data.access_token);
        localStorage.setItem("riskops_user", JSON.stringify(data.user));
        setUser(data.user);
      }
      return data.user;
    } finally {
      if (sessionVersion.current === version) setLoading(false);
    }
  }, []);

  const hasRole = useCallback(
    (...roles) => Array.isArray(user?.roles) && roles.some((role) => user.roles.includes(role)),
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
