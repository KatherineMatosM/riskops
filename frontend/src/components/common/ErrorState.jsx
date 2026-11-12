import { AlertTriangle } from "lucide-react";

export default function ErrorState({ message = "Ocurrió un error al cargar la información." }) {
  return (
    <div className="state-message error-state" role="alert">
      <span className="state-icon"><AlertTriangle size={27} aria-hidden="true" /></span>
      <span>{message}</span>
    </div>
  );
}
