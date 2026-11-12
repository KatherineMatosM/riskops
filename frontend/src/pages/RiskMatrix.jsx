import { useState, useEffect } from "react";
import { Grid3x3, Layers3, ShieldAlert, ShieldCheck } from "lucide-react";
import * as dashboardService from "../services/dashboardService";
import RiskMatrixGrid from "../components/matrix/RiskMatrixGrid";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import PageHeader from "../components/common/PageHeader";
import StatCard from "../components/dashboard/StatCard";

export default function RiskMatrix() {
  const [cells, setCells] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    dashboardService.getRiskMatrix().then(setCells).catch(() => setLoadError("No se pudo cargar la matriz de riesgo."));
  }, []);

  if (loadError) return <ErrorState message={loadError} />;
  if (!cells) return <LoadingState variant="matrix" />;
  const total = cells.reduce((sum, cell) => sum + cell.count, 0);
  const critical = cells.reduce((sum, cell) => sum + (cell.probability * cell.impact > 16 ? cell.count : 0), 0);
  const medium = cells.reduce((sum, cell) => sum + (cell.probability * cell.impact > 4 && cell.probability * cell.impact <= 9 ? cell.count : 0), 0);

  return (
    <div className="risk-matrix-page">
      <PageHeader icon={Grid3x3} title="Matriz de riesgo" description="Visualiza la distribución de riesgos según su probabilidad e impacto." />
      <div className="stats-grid">
        <StatCard icon={Layers3} label="Riesgos en la matriz" value={total} />
        <StatCard icon={ShieldAlert} label="En zonas críticas" value={critical} accent="#dc3545" />
        <StatCard icon={ShieldCheck} label="De nivel medio" value={medium} accent="#d89a12" />
      </div>
      <div className="card matrix-layout">
        <div className="matrix-visual">
          <div className="risk-matrix-chart">
            <span className="risk-matrix-y-label">Probabilidad</span>
            <RiskMatrixGrid cells={cells} />
          </div>
          <div className="risk-matrix-x-label">Impacto</div>
          <p className="matrix-help">Selecciona una celda con riesgos para consultar su registro.</p>
        </div>
        <aside className="matrix-legend">
          <h3>Leyenda de niveles de riesgo</h3>
          <ul className="legend-list">
            <li className="legend-item"><span className="legend-swatch" style={{ background: "#c8e6c9" }} /><div><strong>Bajo <span className="text-muted">· 1–4</span></strong><p>Riesgo aceptable. Mantén el monitoreo.</p></div></li>
            <li className="legend-item"><span className="legend-swatch" style={{ background: "#fff9c4" }} /><div><strong>Medio <span className="text-muted">· 5–9</span></strong><p>Riesgo moderado. Evalúa acciones de mitigación.</p></div></li>
            <li className="legend-item"><span className="legend-swatch" style={{ background: "#ffcc80" }} /><div><strong>Alto <span className="text-muted">· 10–16</span></strong><p>Riesgo significativo. Prioriza su tratamiento.</p></div></li>
            <li className="legend-item"><span className="legend-swatch" style={{ background: "#ef9a9a" }} /><div><strong>Crítico <span className="text-muted">· 17–25</span></strong><p>Riesgo severo. Requiere atención inmediata.</p></div></li>
          </ul>
          {critical > 0 && <div className="alert alert-error"><ShieldAlert size={24} /><div><strong>{critical} {critical === 1 ? "riesgo se concentra" : "riesgos se concentran"} en zonas críticas.</strong><p>Prioriza las acciones de mitigación para reducir la exposición.</p></div></div>}
        </aside>
      </div>
    </div>
  );
}
