import { Inbox } from "lucide-react";

export default function EmptyState({ message = "No hay datos para mostrar.", icon: Icon = Inbox }) {
  return (
    <div className="state-message">
      <span className="state-icon"><Icon size={28} aria-hidden="true" /></span>
      <span>{message}</span>
    </div>
  );
}
