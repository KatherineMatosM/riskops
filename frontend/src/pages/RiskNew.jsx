import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RiskForm from "../components/risks/RiskForm";
import * as riskService from "../services/riskService";
import * as riskCategoryService from "../services/riskCategoryService";

export default function RiskNew() {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    riskCategoryService.listCategories().then(setCategories);
  }, []);

  async function handleSubmit(payload) {
    const risk = await riskService.createRisk(payload);
    navigate(`/risks/${risk.id}`);
  }

  return (
    <div className="risk-new-page">
      <h2>Nuevo riesgo</h2>
      <RiskForm categories={categories} onSubmit={handleSubmit} submitLabel="Crear riesgo" />
    </div>
  );
}