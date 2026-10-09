import { RISK_LEVELS, RISK_STATUSES } from "../../utils/constants";
import SearchInput from "../common/SearchInput";

export default function RiskFilters({ filters, onChange, categories }) {
  function update(field, value) {
    onChange({ ...filters, [field]: value, page: 1 });
  }

  return (
    <div className="filters-bar">
      <SearchInput value={filters.search || ""} onChange={(value) => update("search", value)} />

      <select value={filters.category_id || ""} onChange={(e) => update("category_id", e.target.value || undefined)}>
        <option value="">Todas las categorias</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>

      <select value={filters.status || ""} onChange={(e) => update("status", e.target.value || undefined)}>
        <option value="">Todos los estados</option>
        {RISK_STATUSES.map((status) => (
          <option key={status} value={status}>{status}</option>
        ))}
      </select>

      <select value={filters.risk_level || ""} onChange={(e) => update("risk_level", e.target.value || undefined)}>
        <option value="">Todos los niveles</option>
        {RISK_LEVELS.map((level) => (
          <option key={level} value={level}>{level}</option>
        ))}
      </select>
    </div>
  );
}