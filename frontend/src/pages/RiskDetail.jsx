import { useState, useEffect, useCallback, useId } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Pencil, ShieldAlert, BarChart3, Crosshair, ArrowLeft, ClipboardCheck, History, Loader2 } from "lucide-react";
import * as riskService from "../services/riskService";
import * as evaluationService from "../services/evaluationService";
import { useMitigations } from "../hooks/useMitigations";
import { useAuth } from "../hooks/useAuth";
import Card from "../components/common/Card";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import Alert from "../components/common/Alert";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import StatCard from "../components/dashboard/StatCard";
import MitigationPlanTable from "../components/mitigations/MitigationPlanTable";
import RiskLevelBadge from "../components/common/RiskLevelBadge";
import FieldError from "../components/common/FieldError";
import { getValidationMessage } from "../utils/formValidation";
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
  const [loadError, setLoadError] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationError, setEvaluationError] = useState(null);
  const [evaluationSuccess, setEvaluationSuccess] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const evaluationId = useId();
  const { plans, loading: plansLoading } = useMitigations(riskId);

  const loadData = useCallback(async () => {
    setLoadError(null);
    try {
      const [riskData, evaluationData] = await Promise.all([
        riskService.getRisk(riskId),
        evaluationService.listEvaluations(riskId),
      ]);
      setRisk(riskData);
      setEvaluations(evaluationData);
    } catch {
      setLoadError("No se pudo cargar el detalle y las evaluaciones del riesgo.");
    }
  }, [riskId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleEvaluate(e) {
    e.preventDefault();
    setEvaluating(true);
    setEvaluationError(null);
    setEvaluationSuccess(null);
    try {
      await evaluationService.evaluateRisk(riskId, {
        probability: Number(probability), impact: Number(impact), observations: observations || null,
      });
      setProbability("");
      setImpact("");
      setObservations("");
      setEvaluationSuccess("La evaluación se registró correctamente.");
      loadData();
    } catch (err) {
      setEvaluationError(err.response?.data?.message || "No se pudo registrar la evaluación. Inténtalo de nuevo.");
    } finally {
      setEvaluating(false);
    }
  }

  function handleEvaluationInvalid(event) {
    const input = event.target;
    setFieldErrors((current) => ({ ...current, [input.name]: getValidationMessage(input) }));
  }

  function clearFieldError(field) {
    setFieldErrors((current) => ({ ...current, [field]: "" }));
  }

  if (loadError) return <ErrorState message={loadError} />;
  if (!risk) return <LoadingState variant="detail" />;

  const canManage = hasRole(ROLES.ADMIN, ROLES.RISK_MANAGER, ROLES.ANALYST);

  return (
    <div className="risk-detail-page">
      <Link className="back-link" to="/risks"><ArrowLeft size={16} />Volver a riesgos</Link>
      <PageHeader
        icon={ShieldAlert}
        title={risk.title}
        description="Consulta la información, las evaluaciones y los planes de mitigación del riesgo."
        actions={canManage && (
          <button className="secondary-button button-with-icon" onClick={() => navigate(`/risks/${riskId}/edit`)}>
            <Pencil size={17} /> Editar riesgo
          </button>
        )}
      />
      <div className="stats-grid">
        <StatCard icon={ShieldAlert} label="Puntuación del riesgo" value={risk.risk_score ?? "—"} />
        <StatCard icon={BarChart3} label="Probabilidad" value={risk.probability ?? "—"} />
        <StatCard icon={Crosshair} label="Impacto" value={risk.impact ?? "—"} />
      </div>

      <div className="detail-grid">
        <Card title="Información del riesgo">
          <p className="detail-description">{risk.description || "Este riesgo no tiene una descripción registrada."}</p>
          <dl className="detail-metadata">
            <div><dt>Estado actual</dt><dd><span className={`status-badge status-${risk.status?.toLowerCase()}`}>{formatStatus(risk.status)}</span></dd></div>
            <div><dt>Nivel de riesgo</dt><dd><RiskLevelBadge level={risk.risk_level} /></dd></div>
          </dl>
        </Card>
        <Card title="Historial de evaluaciones">
          {evaluations.length === 0 ? (
            <EmptyState icon={History} message="Este riesgo aún no ha sido evaluado." />
          ) : (
            <ul className="evaluation-list">
              {evaluations.map((ev) => (
                <li className="evaluation-entry" key={ev.id}>
                  <div className="evaluation-entry-header"><time>{formatDateTime(ev.evaluation_date)}</time><RiskLevelBadge level={ev.risk_level} /></div>
                  <p>Probabilidad <strong>{ev.probability}</strong><span aria-hidden="true"> · </span>Impacto <strong>{ev.impact}</strong></p>
                  {ev.observations && <p className="text-muted">{ev.observations}</p>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {canManage && (
        <Card title="Registrar una evaluación">
          <Alert type="error" message={evaluationError} />
          <Alert type="success" message={evaluationSuccess} />
          <form className="app-form inline-form evaluation-form" onSubmit={handleEvaluate} onInvalid={handleEvaluationInvalid} aria-busy={evaluating}>
            <div className="form-field"><label htmlFor={`${evaluationId}-probability`}>
              Probabilidad
              <select id={`${evaluationId}-probability`} name="probability" value={probability} onChange={(e) => { setProbability(e.target.value); clearFieldError("probability"); }} aria-invalid={Boolean(fieldErrors.probability)} aria-describedby={fieldErrors.probability ? `${evaluationId}-probability-error` : undefined} required>
                <option value="">Selecciona</option>
                {SCALE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label><FieldError id={`${evaluationId}-probability-error`}>{fieldErrors.probability}</FieldError></div>
            <div className="form-field"><label htmlFor={`${evaluationId}-impact`}>
              Impacto
              <select id={`${evaluationId}-impact`} name="impact" value={impact} onChange={(e) => { setImpact(e.target.value); clearFieldError("impact"); }} aria-invalid={Boolean(fieldErrors.impact)} aria-describedby={fieldErrors.impact ? `${evaluationId}-impact-error` : undefined} required>
                <option value="">Selecciona</option>
                {SCALE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label><FieldError id={`${evaluationId}-impact-error`}>{fieldErrors.impact}</FieldError></div>
            <label>
              Observaciones
              <input placeholder="Añade un contexto para esta evaluación" value={observations} onChange={(e) => setObservations(e.target.value)} />
            </label>
            <button type="submit" className="primary-button button-with-icon" disabled={evaluating}>{evaluating ? <Loader2 size={18} className="spin" /> : <ClipboardCheck size={18} />}{evaluating ? "Registrando..." : "Registrar evaluación"}</button>
          </form>
        </Card>
      )}

      <Card
        title="Planes de mitigación"
        actions={
          canManage && (
            <button className="link-button" onClick={() => navigate(`/mitigations?risk_id=${riskId}`)}>
              Gestionar
            </button>
          )
        }
      >
        {plansLoading ? <LoadingState variant="table" rows={3} columns={4} /> : plans.length === 0 ? (
          <EmptyState message="No hay planes de mitigación asociados a este riesgo." />
        ) : (
          <MitigationPlanTable plans={plans} onSelect={() => navigate(`/mitigations?risk_id=${riskId}`)} />
        )}
      </Card>
    </div>
  );
}
