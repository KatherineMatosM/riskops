import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useRisks } from "../hooks/useRisks";
import { useAuth } from "../hooks/useAuth";
import RiskFilters from "../components/risks/RiskFilters";
import RiskTable from "../components/risks/RiskTable";
import Pagination from "../components/common/Pagination";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import EmptyState from "../components/common/EmptyState";
import * as riskCategoryService from "../services/riskCategoryService";
import { ROLES } from "../utils/constants";

export default function Risks() {
  const [filters, setFilters] = useState({ page: 1, page_size: 20 });
  const [categories, setCategories] = useState([]);
  const { risks, pagination, loading, error } = useRisks(filters);
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    riskCategoryService.listCategories().then(setCategories);
  }, []);

  return (
    <div className="risks-page">
      <div className="page-header">
        <h2>Riesgos</h2>
        {hasRole(ROLES.ADMIN, ROLES.RISK_MANAGER, ROLES.ANALYST) && (
          <button className="primary-button button-with-icon" onClick={() => navigate("/risks/new")}>
            <Plus size={16} /> Nuevo riesgo
          </button>
        )}
      </div>

      <RiskFilters filters={filters} onChange={setFilters} categories={categories} />

      {loading && <LoadingState />}
      {error && <ErrorState />}
      {!loading && !error && risks.length === 0 && <EmptyState message="No se encontraron riesgos." />}
      {!loading && !error && risks.length > 0 && <RiskTable risks={risks} />}

      <Pagination
        page={pagination.page}
        totalPages={pagination.total_pages}
        onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
      />
    </div>
  );
}