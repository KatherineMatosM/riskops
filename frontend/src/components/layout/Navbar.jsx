import { useLocation, useNavigate } from "react-router-dom";
import { Bell, UserRound, LogOut } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const section = { dashboard: "Dashboard", risks: "Riesgos", "risk-matrix": "Matriz de riesgo", mitigations: "Mitigaciones", reports: "Reportes", analytics: "Análisis", notifications: "Notificaciones", users: "Usuarios", profile: "Mi perfil" }[pathname.split("/")[1]];

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="navbar">
      <div className="navbar-context"><span>Espacio de trabajo</span><span aria-hidden="true">/</span><strong>{section}</strong></div>
      <div className="navbar-spacer" />
      <div className="navbar-actions">
        <button type="button" className="icon-button notification-button" aria-label={`Notificaciones${unreadCount > 0 ? `, ${unreadCount} sin leer` : ""}`} title="Notificaciones" onClick={() => navigate("/notifications")}>
          <Bell size={21} aria-hidden="true" />
          {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        </button>
        <button type="button" className="navbar-profile" title="Mi perfil" onClick={() => navigate("/profile")}>
          <span className="navbar-avatar"><UserRound size={23} strokeWidth={1.7} aria-hidden="true" /></span>
          <span className="navbar-user-copy"><strong>{user?.full_name}</strong><span>Mi perfil</span></span>
        </button>
        <button type="button" className="link-button navbar-logout" onClick={handleLogout} title="Cerrar sesión">
          <LogOut size={19} aria-hidden="true" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </header>
  );
}
