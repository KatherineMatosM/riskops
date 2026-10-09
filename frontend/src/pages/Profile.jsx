import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import * as userService from "../services/userService";
import * as authService from "../services/authService";

export default function Profile() {
  const { user, setUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  async function handleUpdateProfile(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const updated = await userService.updateMyProfile({ full_name: fullName });
      setUser(updated);
      localStorage.setItem("riskops_user", JSON.stringify(updated));
      setMessage("Perfil actualizado correctamente.");
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo actualizar el perfil.");
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Contrasena actualizada correctamente.");
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo actualizar la contrasena.");
    }
  }

  return (
    <div className="profile-page">
      <h2>Mi perfil</h2>
      {message && <div className="alert alert-success"><span>{message}</span></div>}
      {error && <div className="alert alert-error"><span>{error}</span></div>}

      <form className="app-form" onSubmit={handleUpdateProfile}>
        <label>
          Nombre completo
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </label>
        <button type="submit" className="primary-button">Guardar cambios</button>
      </form>

      <form className="app-form" onSubmit={handleChangePassword}>
        <h3>Cambiar contrasena</h3>
        <label>
          Contrasena actual
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
        </label>
        <label>
          Nueva contrasena
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
        </label>
        <button type="submit" className="primary-button">Actualizar contrasena</button>
      </form>
    </div>
  );
}