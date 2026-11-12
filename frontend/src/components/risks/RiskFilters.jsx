import { RISK_LEVELS, RISK_STATUSES } from "../../utils/constants";
import SearchInput from "../common/SearchInput";
import { riskLevelLabel } from "../../utils/riskLevelHelper";
import { formatStatus } from "../../utils/formatters";

export default function RiskFilters({ filters, onChange, categories }) {
  function update(field, value) {
    onChange({ ...filters, [field]: value, page: 1 });
  }

  return (
    <div className="filters-bar risk-filters" role="search" aria-label="Filtrar riesgos">
      <SearchInput placeholder="Buscar riesgo..." value={filters.search || ""} onChange={(value) => update("search", value)} />

      <select aria-label="Categoría del riesgo" value={filters.category_id || ""} onChange={(e) => update("category_id", e.target.value || undefined)}>
        <option value="">Todas las categorías</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>

      <select aria-label="Estado del riesgo" value={filters.status || ""} onChange={(e) => update("status", e.target.value || undefined)}>
        <option value="">Todos los estados</option>
        {RISK_STATUSES.map((status) => (
          <option key={status} value={status}>{formatStatus(status)}</option>
        ))}
      </select>

      <select aria-label="Nivel del riesgo" value={filters.risk_level || ""} onChange={(e) => update("risk_level", e.target.value || undefined)}>
        <option value="">Todos los niveles</option>
        {RISK_LEVELS.map((level) => (
          <option key={level} value={level}>{riskLevelLabel(level)}</option>
        ))}
      </select>
    </div>
  );
}
