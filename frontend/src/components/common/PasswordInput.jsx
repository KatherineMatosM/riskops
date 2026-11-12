import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function PasswordInput({ icon: Icon, visibilityLabel = "contraseña", ...inputProps }) {
  const [visible, setVisible] = useState(false);

  return (
    <span className={`password-input${Icon ? " input-with-icon" : ""}`}>
      {Icon && <Icon size={18} aria-hidden="true" />}
      <input {...inputProps} type={visible ? "text" : "password"} />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((current) => !current)}
        aria-label={`${visible ? "Ocultar" : "Mostrar"} ${visibilityLabel}`}
        aria-pressed={visible}
      >
        {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
      </button>
    </span>
  );
}
