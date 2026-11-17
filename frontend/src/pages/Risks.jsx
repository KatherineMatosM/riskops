import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Layers3, ShieldAlert, ClipboardCheck } from "lucide-react";
import { useRisks } from "../hooks/useRisks";
import { useAuth } from "../hooks/useAuth";
import RiskFilters from "../components/risks/RiskFilters";
import RiskTable from "../components/risks/RiskTable";
import Pagination from "../components/common/Pagination";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import EmptyState from "../components/common/EmptyState";
import Alert from "../components/common/Alert";
import PageHeader from "../components/common/PageHeader";
import StatCard from "../components/dashboard/StatCard";
import * as riskCategoryService from "../services/riskCategoryService";
import { ROLES } from "../utils/constants";

export default function Risks() {
  const [searchParams, setSearchParams] = useSearchParams();
  const readAxis = (name) => /^[1-5]$/.test(searchParams.get(name) || "") ? Number(searchParams.get(name)) : undefined;
  const probability = readAxis("probability");
  const impact = readAxis("impact");
  const matrixKey = `${probability || ""}:${impact || ""}`;
  const [filterState, setFilterState] = useState({ matrixKey, values: { page: 1, page_size: 20 } });
  const values = filterState.matrixKey === matrixKey ? filterState.values : { page: 1, page_size: 20 };
  const filters = { ...values, probability, impact };
  function setFilters(next) {
    setFilterState({ matrixKey, values: typeof next === "function" ? next(filters) : next });
  }
  function clearMatrixFilter() {
    const next = new URLSearchParams(searchParams);
    next.delete("probability");
    next.delete("impact");
    setFilterState({ matrixKey: ":", values: { ...values, page: 1 } });
    setSearchParams(next);
  }
  const [categories, setCategories] = useState([]);
  const [categoryError, setCategoryError] = useState(null);
  const { risks, pagination, loading, error } = useRisks(filters);
  const { hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    riskCategoryService.listCategories().then(setCategories).catch(() => setCategoryError("No se pudieron cargar las categorías del filtro."));
  }, []);

  return (
    <div className="risks-page">
      <PageHeader
        icon={ShieldAlert}
        title="Riesgos"
        description="Gestiona, evalúa y da seguimiento a los riesgos de tu organización."
        actions={hasRole(ROLES.ADMIN, ROLES.RISK_MANAGER, ROLES.ANALYST) && (
          <button className="primary-button button-with-icon" onClick={() => navigate("/risks/new")}>
            <Plus size={18} /> Nuevo riesgo
          </button>
        )}
      />

      <div className="stats-grid">
        <StatCard icon={Layers3} label="Riesgos encontrados" value={loading ? "—" : pagination.total} loading={loading} />
        <StatCard icon={ShieldAlert} label="Críticos en esta página" value={loading ? "—" : risks.filter((risk) => risk.risk_level === "CRITICAL").length} accent="#dc3545" loading={loading} />
        <StatCard icon={ClipboardCheck} label="En mitigación en esta página" value={loading ? "—" : risks.filter((risk) => risk.status === "MITIGATION_IN_PROGRESS").length} accent="#15976b" loading={loading} />
      </div>

      {(probability || impact) && <div className="table-toolbar">
        <span role="status">Filtro de matriz: {[probability && `probabilidad ${probability}`, impact && `impacto ${impact}`].filter(Boolean).join(" · ")}</span>
        <button type="button" className="link-button" onClick={clearMatrixFilter}>Quitar filtro de matriz</button>
      </div>}
      <RiskFilters filters={filters} onChange={setFilters} categories={categories} />
      <Alert type="error" message={categoryError} />

      <div className="card table-card">
        <div className="table-toolbar">
          <h3>Registro de riesgos</h3>
          {!loading && !error && <span className="text-muted">{pagination.total} {pagination.total === 1 ? "resultado" : "resultados"}</span>}
        </div>
        {loading && <LoadingState variant="table" rows={5} columns={5} />}
        {error && <ErrorState />}
        {!loading && !error && risks.length === 0 && <EmptyState message="No se encontraron riesgos con los filtros seleccionados." />}
        {!loading && !error && risks.length > 0 && <RiskTable risks={risks} />}

        <Pagination
          page={pagination.page}
          totalPages={pagination.total_pages}
          onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
        />
      </div>
    </div>
  );
}
