import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RiskForm from "../components/risks/RiskForm";
import * as riskService from "../services/riskService";
import * as riskCategoryService from "../services/riskCategoryService";
import LoadingState from "../components/common/LoadingState";

export default function RiskEdit() {
  const { riskId } = useParams();
  const [risk, setRisk] = useState(null);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([riskService.getRisk(riskId), riskCategoryService.listCategories()]).then(
      ([riskData, categoryData]) => {
        setRisk(riskData);
        setCategories(categoryData);
      }
    );
  }, [riskId]);

  async function handleSubmit(payload) {
    await riskService.updateRisk(riskId, payload);
    navigate(`/risks/${riskId}`);
  }

  if (!risk) return <LoadingState />;

  return (
    <div className="risk-edit-page">
      <h2>Editar riesgo</h2>
      <RiskForm initialValues={risk} categories={categories} onSubmit={handleSubmit} submitLabel="Guardar cambios" />
    </div>
  );
}