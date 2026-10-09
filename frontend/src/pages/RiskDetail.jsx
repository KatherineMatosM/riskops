import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Pencil } from "lucide-react";
import * as riskService from "../services/riskService";
import * as evaluationService from "../services/evaluationService";
import { useMitigations } from "../hooks/useMitigations";
import { useAuth } from "../hooks/useAuth";
import Card from "../components/common/Card";
import LoadingState from "../components/common/LoadingState";
import MitigationPlanTable from "../components/mitigations/MitigationPlanTable";
import { riskLevelColor, riskLevelLabel } from "../utils/riskLevelHelper";
import { formatStatus, formatDateTime } from "../utils/formatters";
import { SCALE_OPTIONS, ROLES } from "../utils/constants";

export default function RiskDetail() {
  const { riskId } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [risk, setRisk] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [probability, setProbability] = useState("");
  const [impact, setImpact] = useState("");
  const [observations, setObservations] = useState("");
  const { plans } = useMitigations(riskId);

  const loadData = useCallback(async () => {
    const [riskData, evaluationData] = await Promise.all([
      riskService.getRisk(riskId),
      evaluationService.listEvaluations(riskId),
    ]);
    setRisk(riskData);
    setEvaluations(evaluationData);
  }, [riskId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleEvaluate(e) {
    e.preventDefault();
    await evaluationService.evaluateRisk(riskId, {
      probability: Number(probability), impact: Number(impact), observations: observations || null,
    });
    setProbability("");
    setImpact("");
    setObservations("");
    loadData();
  }

  if (!risk) return <LoadingState />;

  const canManage = hasRole(ROLES.ADMIN, ROLES.RISK_MANAGER, ROLES.ANALYST);

  return (
    <div className="risk-detail-page">
      <div className="page-header">
        <h2>{risk.title}</h2>
        {canManage && (
          <button className="secondary-button button-with-icon" onClick={() => navigate(`/risks/${riskId}/edit`)}>
            <Pencil size={15} /> Editar
          </button>
        )}
      </div>

      <Card title="Detalle">
        <p>{risk.description || "Sin descripcion."}</p>
        <p>Estado: {formatStatus(risk.status)}</p>
        <p>
          Nivel:{" "}
          <span className="risk-level-badge" style={{ backgroundColor: riskLevelColor(risk.risk_level) }}>
            {riskLevelLabel(risk.risk_level)}
          </span>
        </p>
        <p>Puntuacion: {risk.risk_score ?? "-"}</p>
      </Card>

      {canManage && (
        <Card title="Evaluar riesgo">
          <form className="app-form inline-form" onSubmit={handleEvaluate}>
            <label>
              Probabilidad
              <select value={probability} onChange={(e) => setProbability(e.target.value)} required>
                <option value="">-</option>
                {SCALE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <label>
              Impacto
              <select value={impact} onChange={(e) => setImpact(e.target.value)} required>
                <option value="">-</option>
                {SCALE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <label>
              Observaciones
              <input value={observations} onChange={(e) => setObservations(e.target.value)} />
            </label>
            <button type="submit" className="primary-button">Registrar evaluacion</button>
          </form>
        </Card>
      )}

      <Card title="Historial de evaluaciones">
        {evaluations.length === 0 ? (
          <p className="empty-state">Este riesgo aun no ha sido evaluado.</p>
        ) : (
          <ul className="evaluation-list">
            {evaluations.map((ev) => (
              <li key={ev.id}>
                {formatDateTime(ev.evaluation_date)} — Probabilidad {ev.probability}, Impacto {ev.impact},
                Nivel {riskLevelLabel(ev.risk_level)}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card
        title="Planes de mitigacion"
        actions={
          canManage && (
            <button className="link-button" onClick={() => navigate(`/mitigations?risk_id=${riskId}`)}>
              Gestionar
            </button>
          )
        }
      >
        {plans.length === 0 ? (
          <p className="empty-state">No hay planes de mitigacion para este riesgo.</p>
        ) : (
          <MitigationPlanTable plans={plans} onSelect={() => navigate(`/mitigations?risk_id=${riskId}`)} />
        )}
      </Card>
    </div>
  );
}