import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Loader2, LockKeyhole, LogIn, Mail } from "lucide-react";
import PasswordInput from "../components/common/PasswordInput";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Credenciales invalidas.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="app-form login-form" onSubmit={handleSubmit} aria-busy={loading}>
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
      <label>
        Correo electrónico
        <span className="input-with-icon"><Mail size={18} aria-hidden="true" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@empresa.com" autoComplete="username" required /></span>
      </label>
      <label>
        Contraseña
          <PasswordInput icon={LockKeyhole} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Ingresa tu contraseña" autoComplete="current-password" required />
      </label>
      <button type="submit" className="primary-button button-with-icon" disabled={loading}>
        {loading ? <Loader2 size={18} className="spin" /> : <LogIn size={18} />}
        {loading ? "Ingresando..." : "Ingresar"}
      </button>
      <p className="login-security"><LockKeyhole size={14} aria-hidden="true" /> Acceso seguro a tu espacio de trabajo</p>
    </form>
  );
}
