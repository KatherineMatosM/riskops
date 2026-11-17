import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Pencil } from "lucide-react";
import PageHeader from "../components/common/PageHeader";
import RiskForm from "../components/risks/RiskForm";
import * as riskService from "../services/riskService";
import * as riskCategoryService from "../services/riskCategoryService";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";

export default function RiskEdit() {
  const { riskId } = useParams();
  const [risk, setRisk] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    setRisk(null);
    setLoadError(null);
    Promise.all([riskService.getRisk(riskId), riskCategoryService.listCategories()]).then(
      ([riskData, categoryData]) => {
        if (!active) return;
        setRisk(riskData);
        setCategories(categoryData);
      }
    ).catch(() => { if (active) setLoadError("No se pudo cargar la información del riesgo."); });
    return () => { active = false; };
  }, [riskId]);

  async function handleSubmit(payload) {
    await riskService.updateRisk(riskId, payload);
    navigate(`/risks/${riskId}`);
  }

  return (
    <div className="risk-edit-page">
      <PageHeader icon={Pencil} title="Editar riesgo" description="Actualiza la información del riesgo y su evaluación inicial." />
      {loadError ? <ErrorState message={loadError} /> : !risk ? <LoadingState variant="form" /> : <RiskForm key={riskId} initialValues={risk} categories={categories} onSubmit={handleSubmit} submitLabel="Guardar cambios" />}
    </div>
  );
}
