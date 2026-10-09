import { AlertTriangle } from "lucide-react";

export default function ErrorState({ message = "Ocurrio un error al cargar la informacion." }) {
  return (
    <div className="state-message error-state">
      <AlertTriangle size={22} />
      <span>{message}</span>
    </div>
  );
}