import { useNavigate } from "react-router-dom";
import { Bell, UserCircle2, LogOut } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="navbar">
      <div className="navbar-spacer" />
      <div className="navbar-actions">
        <button className="icon-button" onClick={() => navigate("/notifications")}>
          <Bell size={18} />
          {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        </button>
        <button className="link-button" onClick={() => navigate("/profile")}>
          <UserCircle2 size={18} />
          {user?.full_name}
        </button>
        <button className="link-button" onClick={handleLogout}>
          <LogOut size={16} />
          Cerrar sesion
        </button>
      </div>
    </header>
  );
}