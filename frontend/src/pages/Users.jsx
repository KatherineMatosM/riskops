import { useState, useEffect } from "react";
import { CheckCircle2, Crown, Loader2, ShieldCheck, UserPlus, Users as UsersIcon, XCircle } from "lucide-react";
import * as userService from "../services/userService";
import Table from "../components/common/Table";
import Modal from "../components/common/Modal";
import Card from "../components/common/Card";
import PageHeader from "../components/common/PageHeader";
import PasswordInput from "../components/common/PasswordInput";
import FieldError from "../components/common/FieldError";
import { getValidationMessage } from "../utils/formValidation";
import StatCard from "../components/dashboard/StatCard";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import { ROLES } from "../utils/constants";
import { formatRole } from "../utils/formatters";
import { useAuth } from "../hooks/useAuth";
import { getErrorMessage, getFieldErrors } from "../utils/apiErrors";

export default function Users() {
  const { hasRole } = useAuth();
  const canCreate = hasRole(ROLES.ADMIN);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", roles: [ROLES.VIEWER] });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [creating, setCreating] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  async function loadUsers() {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await userService.listUsers();
      setUsers(data);
    } catch (err) {
      setLoadError(err.response?.data?.message || "No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleInvalid(event) {
    const input = event.target;
    setFieldErrors((current) => ({ ...current, [input.name]: getValidationMessage(input) }));
  }

  function toggleRole(role) {
    setForm((prev) => ({
      ...prev,
      roles: prev.roles.includes(role) ? prev.roles.filter((r) => r !== role) : [...prev.roles, role],
    }));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setCreating(true);
    try {
      await userService.createUser(form);
      setShowModal(false);
      setForm({ full_name: "", email: "", password: "", roles: [ROLES.VIEWER] });
      loadUsers();
    } catch (err) {
      setFieldErrors(getFieldErrors(err, ["full_name", "email", "password"]));
      setError(getErrorMessage(err, "No se pudo crear el usuario."));
    } finally {
      setCreating(false);
    }
  }

  const columns = [
    { key: "full_name", label: "Nombre", render: (row) => <div className="user-cell"><span className="user-avatar">{row.full_name?.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</span><strong>{row.full_name}</strong></div> },
    { key: "email", label: "Correo" },
    { key: "roles", label: "Roles", render: (row) => <div className="role-badges">{row.roles.map((role) => <span className="role-badge" key={role}>{role === ROLES.ADMIN && <Crown size={14} />}{formatRole(role)}</span>)}</div> },
    { key: "is_active", label: "Estado", render: (row) => <span className={`status-badge ${row.is_active ? "status-success" : "status-muted"}`}>{row.is_active ? <CheckCircle2 size={14} /> : <XCircle size={14} />}{row.is_active ? "Activo" : "Inactivo"}</span> },
  ];

  return (
    <div className="users-page">
      <PageHeader icon={UsersIcon} title="Usuarios" description="Administra las cuentas, los roles y los permisos del sistema." actions={canCreate && <button className="primary-button button-with-icon" onClick={() => { setError(null); setFieldErrors({}); setShowModal(true); }}><UserPlus size={18} /> Nuevo usuario</button>} />
      {loading ? <LoadingState variant="users" label="Cargando usuarios..." /> : loadError ? <Card><ErrorState message={loadError} /><button type="button" className="secondary-button" onClick={loadUsers}>Reintentar</button></Card> : <>
        <div className="stats-grid">
          <StatCard icon={UsersIcon} label="Total usuarios" value={users.length} />
          <StatCard icon={Crown} label="Administradores" value={users.filter((item) => item.roles.includes(ROLES.ADMIN)).length} accent="#d97706" />
          <StatCard icon={ShieldCheck} label="Activos" value={users.filter((item) => item.is_active).length} accent="#16a36a" />
        </div>
        <Card title="Directorio de usuarios" description="Cuentas con acceso a RiskOps."><Table columns={columns} data={users} emptyMessage="Todavía no hay usuarios registrados." /></Card>
      </>}
      <Modal open={canCreate && showModal} title="Nuevo usuario" icon={UserPlus} description="Crea una nueva cuenta y asigna sus permisos." onClose={() => setShowModal(false)}>
        <form className="app-form" onSubmit={handleCreate} onInvalid={handleInvalid} aria-busy={creating}>
          {error && <div className="alert alert-error" role="alert"><span>{error}</span></div>}
          <div className="form-field"><label htmlFor="new-user-full-name">
            Nombre completo
            <input id="new-user-full-name" name="full_name" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} placeholder="Nombre y apellido" autoComplete="name" minLength={2} maxLength={150} aria-invalid={Boolean(fieldErrors.full_name)} aria-describedby={fieldErrors.full_name ? "new-user-full-name-error" : undefined} required />
          </label><FieldError id="new-user-full-name-error">{fieldErrors.full_name}</FieldError></div>
          <div className="form-field"><label htmlFor="new-user-email">
            Correo electrónico
            <input id="new-user-email" name="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="nombre@empresa.com" autoComplete="email" aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "new-user-email-error" : undefined} required />
          </label><FieldError id="new-user-email-error">{fieldErrors.email}</FieldError></div>
          <div className="form-field"><label htmlFor="new-user-password">
            Contraseña
            <PasswordInput id="new-user-password" name="password" value={form.password} onChange={(e) => update("password", e.target.value)} autoComplete="new-password" minLength={8} aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? "new-user-password-error" : undefined} required />
          </label><FieldError id="new-user-password-error">{fieldErrors.password}</FieldError></div>
          <div className="security-tip"><ShieldCheck size={24} /><p><strong>Roles y permisos</strong>Selecciona uno o más roles para el usuario.</p></div>
          <div className="checkbox-group role-options" role="group" aria-label="Roles y permisos">
            {Object.values(ROLES).map((role) => (
              <label key={role} className={`checkbox-label role-option${form.roles.includes(role) ? " selected" : ""}`}>
                <input type="checkbox" checked={form.roles.includes(role)} onChange={() => toggleRole(role)} />
                {formatRole(role)}
              </label>
            ))}
          </div>
          <div className="form-actions"><button type="button" className="secondary-button" onClick={() => setShowModal(false)}>Cancelar</button><button type="submit" className="primary-button button-with-icon" disabled={creating}>{creating ? <Loader2 size={18} className="spin" /> : <UserPlus size={18} />}{creating ? "Creando..." : "Crear usuario"}</button></div>
        </form>
      </Modal>
    </div>
  );
}
