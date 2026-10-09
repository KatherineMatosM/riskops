import { NavLink } from "react-router-dom";
import {
  ShieldCheck, LayoutDashboard, ShieldAlert, Grid3x3,
  ClipboardCheck, FileBarChart2, Sparkles, Users as UsersIcon,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { ROLES } from "../../utils/constants";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/risks", label: "Riesgos", icon: ShieldAlert },
  { to: "/risk-matrix", label: "Matriz de Riesgo", icon: Grid3x3 },
  { to: "/mitigations", label: "Mitigaciones", icon: ClipboardCheck },
  { to: "/reports", label: "Reportes", icon: FileBarChart2 },
  { to: "/analytics", label: "Analisis", icon: Sparkles },
];

export default function Sidebar() {
  const { hasRole } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand"><ShieldCheck size={20} /> RiskOps</div>
      <nav className="sidebar-nav">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
            >
              <Icon size={18} />
              {link.label}
            </NavLink>
          );
        })}
        {hasRole(ROLES.ADMIN, ROLES.RISK_MANAGER) && (
          <NavLink to="/users" className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
            <UsersIcon size={18} />
            Usuarios
          </NavLink>
        )}
      </nav>
    </aside>
  );
}