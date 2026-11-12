import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Breadcrumbs({ items }) {
  return (
    <nav className="breadcrumbs" aria-label="Ruta de navegación">
      {items.map((item, index) => (
        <span key={index} className="breadcrumb-item">
          {item.to ? <Link to={item.to}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
          {index < items.length - 1 && (
            <span className="breadcrumb-separator"><ChevronRight size={14} /></span>
          )}
        </span>
      ))}
    </nav>
  );
}
