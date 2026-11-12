import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import RiskForm from "../components/risks/RiskForm";
import * as riskService from "../services/riskService";
import * as riskCategoryService from "../services/riskCategoryService";

export default function RiskNew() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    riskCategoryService.listCategories().then(setCategories).catch(() => setLoadError("No se pudieron cargar las categorías del riesgo.")).finally(() => setLoading(false));
  }, []);

  async function handleSubmit(payload) {
    const risk = await riskService.createRisk(payload);
    navigate(`/risks/${risk.id}`);
  }

  return (
    <div className="risk-new-page">
      <PageHeader icon={Plus} title="Nuevo riesgo" description="Registra un nuevo riesgo y define su evaluación inicial." />
      {loadError ? <ErrorState message={loadError} /> : loading ? <LoadingState variant="form" /> : <RiskForm categories={categories} onSubmit={handleSubmit} submitLabel="Crear riesgo" />}
    </div>
  );
}
