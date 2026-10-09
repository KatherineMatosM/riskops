import { Inbox } from "lucide-react";

export default function EmptyState({ message = "No hay datos para mostrar." }) {
  return (
    <div className="state-message">
      <Inbox size={22} />
      <span>{message}</span>
    </div>
  );
}