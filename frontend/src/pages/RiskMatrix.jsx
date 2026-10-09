import { useState, useEffect } from "react";
import * as dashboardService from "../services/dashboardService";
import RiskMatrixGrid from "../components/matrix/RiskMatrixGrid";
import LoadingState from "../components/common/LoadingState";

export default function RiskMatrix() {
  const [cells, setCells] = useState(null);

  useEffect(() => {
    dashboardService.getRiskMatrix().then(setCells);
  }, []);

  if (!cells) return <LoadingState />;

  return (
    <div className="risk-matrix-page">
      <h2>Matriz de Riesgo</h2>
      <p>Eje vertical: Probabilidad. Eje horizontal: Impacto.</p>
      <RiskMatrixGrid cells={cells} />
    </div>
  );
}