import { Link, NavLink } from "react-router-dom";
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
  { to: "/analytics", label: "Análisis", icon: Sparkles },
];

export default function Sidebar() {
  const { hasRole } = useAuth();

  return (
    <aside className="sidebar" aria-label="Navegación principal">
      <Link to="/dashboard" className="sidebar-brand" aria-label="RiskOps, dashboard"><ShieldCheck size={33} strokeWidth={1.8} aria-hidden="true" /><span>RiskOps</span></Link>
      <nav className="sidebar-nav" aria-label="Secciones">
        <span className="sidebar-nav-label">ESPACIO DE TRABAJO</span>
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              title={link.label}
              className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
            >
              <Icon size={21} strokeWidth={1.7} aria-hidden="true" />
              <span className="sidebar-link-label">{link.label}</span>
            </NavLink>
          );
        })}
        {hasRole(ROLES.ADMIN, ROLES.RISK_MANAGER) && (
          <>
            <span className="sidebar-nav-label sidebar-admin-label">ADMINISTRACIÓN</span>
            <NavLink to="/users" title="Usuarios" className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
              <UsersIcon size={21} strokeWidth={1.7} aria-hidden="true" />
              <span className="sidebar-link-label">Usuarios</span>
            </NavLink>
          </>
        )}
      </nav>
      <div className="sidebar-footer"><ShieldCheck size={20} aria-hidden="true" /><div><strong>RiskOps</strong><span>Gestión integral de riesgos</span></div></div>
    </aside>
  );
}
