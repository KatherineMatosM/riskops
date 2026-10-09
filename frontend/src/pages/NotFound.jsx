import { Link } from "react-router-dom";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="not-found-page state-message">
      <FileQuestion size={28} />
      <h2>Pagina no encontrada</h2>
      <Link to="/dashboard">Volver al dashboard</Link>
    </div>
  );
}