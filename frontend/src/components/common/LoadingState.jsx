import { Loader2 } from "lucide-react";

export default function LoadingState({ label = "Cargando..." }) {
  return (
    <div className="state-message">
      <Loader2 size={22} className="spin" />
      <span>{label}</span>
    </div>
  );
}