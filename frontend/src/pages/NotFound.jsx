import { Link } from "react-router-dom";
import { ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="not-found-page state-message">
      <span className="empty-state-icon"><FileQuestion size={36} /></span>
      <span className="eyebrow">ERROR 404</span>
      <h1>Página no encontrada</h1>
      <p>La página que buscas no está disponible o la dirección ha cambiado.</p>
      <Link to="/dashboard" className="primary-button button-with-icon"><ArrowLeft size={18} /> Volver al dashboard</Link>
    </div>
  );
}
