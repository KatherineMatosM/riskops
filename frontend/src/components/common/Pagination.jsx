import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft size={16} /> Anterior
      </button>
      <span>Pagina {page} de {totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        Siguiente <ChevronRight size={16} />
      </button>
    </div>
  );
}