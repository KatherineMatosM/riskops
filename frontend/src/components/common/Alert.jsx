import { AlertCircle, CheckCircle2, Info } from "lucide-react";

const ICONS = { error: AlertCircle, success: CheckCircle2, info: Info };

export default function Alert({ type = "info", message }) {
  if (!message) return null;
  const Icon = ICONS[type] || Info;
  return (
    <div className={`alert alert-${type}`} role={type === "error" ? "alert" : "status"}>
      <Icon size={19} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
