import { useState, useEffect } from "react";
import { UserPlus } from "lucide-react";
import * as userService from "../services/userService";
import Table from "../components/common/Table";
import Modal from "../components/common/Modal";
import { ROLES } from "../utils/constants";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", roles: [ROLES.VIEWER] });
  const [error, setError] = useState(null);

  async function loadUsers() {
    const data = await userService.listUsers();
    setUsers(data);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
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
    try {
      await userService.createUser(form);
      setShowModal(false);
      setForm({ full_name: "", email: "", password: "", roles: [ROLES.VIEWER] });
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo crear el usuario.");
    }
  }

  const columns = [
    { key: "full_name", label: "Nombre" },
    { key: "email", label: "Correo" },
    { key: "roles", label: "Roles", render: (row) => row.roles.join(", ") },
    { key: "is_active", label: "Activo", render: (row) => (row.is_active ? "Si" : "No") },
  ];

  return (
    <div className="users-page">
      <div className="page-header">
        <h2>Usuarios</h2>
        <button className="primary-button button-with-icon" onClick={() => setShowModal(true)}>
          <UserPlus size={16} /> Nuevo usuario
        </button>
      </div>

      <Table columns={columns} data={users} />

      <Modal open={showModal} title="Nuevo usuario" onClose={() => setShowModal(false)}>
        <form className="app-form" onSubmit={handleCreate}>
          {error && <div className="alert alert-error"><span>{error}</span></div>}
          <label>
            Nombre completo
            <input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} required />
          </label>
          <label>
            Correo
            <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
          </label>
          <label>
            Contrasena
            <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} required />
          </label>
          <div className="checkbox-group">
            {Object.values(ROLES).map((role) => (
              <label key={role} className="checkbox-label">
                <input type="checkbox" checked={form.roles.includes(role)} onChange={() => toggleRole(role)} />
                {role}
              </label>
            ))}
          </div>
          <button type="submit" className="primary-button">Crear usuario</button>
        </form>
      </Modal>
    </div>
  );
}