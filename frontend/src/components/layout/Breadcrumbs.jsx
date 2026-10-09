import { ChevronRight } from "lucide-react";

export default function Breadcrumbs({ items }) {
  return (
    <nav className="breadcrumbs">
      {items.map((item, index) => (
        <span key={index} style={{ display: "flex", alignItems: "center" }}>
          {item.to ? <a href={item.to}>{item.label}</a> : <span>{item.label}</span>}
          {index < items.length - 1 && (
            <span className="breadcrumb-separator"><ChevronRight size={14} /></span>
          )}
        </span>
      ))}
    </nav>
  );
}