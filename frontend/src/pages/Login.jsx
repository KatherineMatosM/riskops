import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Loader2, LockKeyhole, LogIn, Mail } from "lucide-react";
import PasswordInput from "../components/common/PasswordInput";
import FieldError from "../components/common/FieldError";
import { getValidationMessage } from "../utils/formValidation";
import { getErrorMessage, getFieldErrors } from "../utils/apiErrors";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  function clearFieldError(field) {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleInvalid(event) {
    const input = event.target;
    setFieldErrors((current) => ({ ...current, [input.name]: getValidationMessage(input) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setFieldErrors(getFieldErrors(err, ["email", "password"]));
      setError(getErrorMessage(err, "Credenciales inválidas."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="app-form login-form" onSubmit={handleSubmit} onInvalid={handleInvalid} aria-busy={loading}>
      <div className="login-heading">
        <span className="eyebrow">BIENVENIDO A RISKOPS</span>
        <h1>Iniciar sesión</h1>
        <p>Accede a tu cuenta para gestionar los riesgos de tu organización.</p>
      </div>
      {error && (
        <div className="alert alert-error" role="alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
      <div className="form-field"><label htmlFor="login-email">
        Correo electrónico
        <span className="input-with-icon"><Mail size={18} aria-hidden="true" /><input id="login-email" name="email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }} placeholder="nombre@empresa.com" autoComplete="username" aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "login-email-error" : undefined} required /></span>
      </label><FieldError id="login-email-error">{fieldErrors.email}</FieldError></div>
      <div className="form-field"><label htmlFor="login-password">
        Contraseña
          <PasswordInput id="login-password" name="password" icon={LockKeyhole} value={password} onChange={(e) => { setPassword(e.target.value); clearFieldError("password"); }} placeholder="Ingresa tu contraseña" autoComplete="current-password" aria-invalid={Boolean(fieldErrors.password)} aria-describedby={fieldErrors.password ? "login-password-error" : undefined} required />
      </label><FieldError id="login-password-error">{fieldErrors.password}</FieldError></div>
      <button type="submit" className="primary-button button-with-icon" disabled={loading}>
        {loading ? <Loader2 size={18} className="spin" /> : <LogIn size={18} />}
        {loading ? "Ingresando..." : "Ingresar"}
      </button>
      <p className="login-security"><LockKeyhole size={14} aria-hidden="true" /> Acceso seguro a tu espacio de trabajo</p>
    </form>
  );
}
