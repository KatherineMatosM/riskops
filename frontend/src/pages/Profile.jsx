import { useState } from "react";
import { Info, Loader2, LockKeyhole, Mail, Save, ShieldCheck, UserRound } from "lucide-react";
import Card from "../components/common/Card";
import PageHeader from "../components/common/PageHeader";
import PasswordInput from "../components/common/PasswordInput";
import FieldError from "../components/common/FieldError";
import { getValidationMessage } from "../utils/formValidation";
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
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  function clearFieldError(field) {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleInvalid(event) {
    const input = event.target;
    setFieldErrors((current) => ({ ...current, [input.name]: getValidationMessage(input) }));
  }

  async function handleUpdateProfile(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSavingProfile(true);
    try {
      const updated = await userService.updateMyProfile({ full_name: fullName });
      setUser(updated);
      localStorage.setItem("riskops_user", JSON.stringify(updated));
      setMessage("Perfil actualizado correctamente.");
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo actualizar el perfil.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSavingPassword(true);
    try {
      await authService.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setMessage("Contraseña actualizada correctamente.");
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo actualizar la contraseña.");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="profile-page">
      <PageHeader icon={UserRound} title="Mi perfil" description="Gestiona tu información personal y la seguridad de tu cuenta en RiskOps." />
      {message && <div className="alert alert-success" role="status"><ShieldCheck size={18} /><span>{message}</span></div>}
      {error && <div className="alert alert-error" role="alert"><Info size={18} /><span>{error}</span></div>}
      <div className="profile-grid">
      <Card title="Información del perfil" description="Actualiza tu información personal y de contacto." icon={UserRound}>
      <div className="profile-identity"><div className="profile-avatar" aria-hidden="true"><UserRound size={52} strokeWidth={1.5} /></div><div><h3>{user?.full_name}</h3><p>{user?.email}</p></div></div>
      <form className="app-form" onSubmit={handleUpdateProfile} onInvalid={handleInvalid} aria-busy={savingProfile}>
        <div className="form-field"><label htmlFor="profile-full-name">
          Nombre completo
          <input id="profile-full-name" name="full_name" value={fullName} onChange={(e) => { setFullName(e.target.value); clearFieldError("full_name"); }} autoComplete="name" aria-invalid={Boolean(fieldErrors.full_name)} aria-describedby={fieldErrors.full_name ? "profile-full-name-error" : undefined} />
        </label><FieldError id="profile-full-name-error">{fieldErrors.full_name}</FieldError></div>
        <label htmlFor="profile-email">Correo electrónico<span className="input-with-icon"><Mail size={18} aria-hidden="true" /><input id="profile-email" name="email" type="email" value={user?.email || ""} readOnly aria-readonly="true" /></span></label>
        <button type="submit" className="primary-button button-with-icon" disabled={savingProfile}>{savingProfile ? <Loader2 size={18} className="spin" /> : <Save size={18} />}{savingProfile ? "Guardando..." : "Guardar cambios"}</button>
      </form>
      </Card>
      <Card title="Cambiar contraseña" description="Actualiza tu contraseña para mantener tu cuenta segura." icon={ShieldCheck}>
      <form className="app-form" onSubmit={handleChangePassword} onInvalid={handleInvalid} aria-busy={savingPassword}>
        <div className="form-field"><label htmlFor="profile-current-password">
          Contraseña actual
          <PasswordInput id="profile-current-password" name="current_password" visibilityLabel="contraseña actual" value={currentPassword} onChange={(e) => { setCurrentPassword(e.target.value); clearFieldError("current_password"); }} autoComplete="current-password" aria-invalid={Boolean(fieldErrors.current_password)} aria-describedby={fieldErrors.current_password ? "profile-current-password-error" : undefined} required />
        </label><FieldError id="profile-current-password-error">{fieldErrors.current_password}</FieldError></div>
        <div className="form-field"><label htmlFor="profile-new-password">
          Nueva contraseña
          <PasswordInput id="profile-new-password" name="new_password" visibilityLabel="nueva contraseña" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); clearFieldError("new_password"); }} autoComplete="new-password" aria-invalid={Boolean(fieldErrors.new_password)} aria-describedby={fieldErrors.new_password ? "profile-new-password-error" : undefined} required />
        </label><FieldError id="profile-new-password-error">{fieldErrors.new_password}</FieldError></div>
        <div className="security-tip"><Info size={22} /><p><strong>Consejo de seguridad</strong>Elige una contraseña única que combine letras, números y caracteres especiales.</p></div>
        <button type="submit" className="primary-button button-with-icon" disabled={savingPassword}>{savingPassword ? <Loader2 size={18} className="spin" /> : <LockKeyhole size={18} />}{savingPassword ? "Actualizando..." : "Actualizar contraseña"}</button>
      </form>
      </Card>
      </div>
    </div>
  );
}
