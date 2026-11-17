import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, ClipboardCheck, ListChecks, Plus, ShieldCheck } from "lucide-react";
import * as riskService from "../services/riskService";
import * as userService from "../services/userService";
import * as mitigationActionService from "../services/mitigationActionService";
import * as mitigationPlanService from "../services/mitigationPlanService";
import { useMitigations } from "../hooks/useMitigations";
import { useAuth } from "../hooks/useAuth";
import Card from "../components/common/Card";
import MitigationPlanTable from "../components/mitigations/MitigationPlanTable";
import MitigationPlanForm from "../components/mitigations/MitigationPlanForm";
import MitigationActionList from "../components/mitigations/MitigationActionList";
import LoadingState from "../components/common/LoadingState";
import EmptyState from "../components/common/EmptyState";
import ErrorState from "../components/common/ErrorState";
import Alert from "../components/common/Alert";
import PageHeader from "../components/common/PageHeader";
import { ROLES } from "../utils/constants";

export default function Mitigations() {
  const [searchParams] = useSearchParams();
  const riskId = searchParams.get("risk_id");
  const { hasRole } = useAuth();
  const canManage = hasRole(ROLES.ADMIN, ROLES.RISK_MANAGER, ROLES.ANALYST);
  const [risk, setRisk] = useState(null);
  const [riskError, setRiskError] = useState(null);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [actions, setActions] = useState([]);
  const [actionsLoading, setActionsLoading] = useState(false);
  const [actionsError, setActionsError] = useState(null);
  const actionVersion = useRef(0);
  const { plans, loading: plansLoading, error: plansError, refresh } = useMitigations(riskId);

  useEffect(() => {
    let active = true;
    actionVersion.current += 1;
    setSelectedPlan(null);
    setActions([]);
    setActionsError(null);
    setActionsLoading(false);
    setRisk(null);
    setRiskError(null);
    if (riskId) {
      riskService.getRisk(riskId).then((data) => { if (active) setRisk(data); }).catch((err) => {
        if (active) setRiskError(err.response?.data?.message || "No se pudo cargar el riesgo.");
      });
    }
    return () => { active = false; actionVersion.current += 1; };
  }, [riskId]);

  const loadAssignees = useCallback(async () => {
    if (!canManage) return;
    setUsersLoading(true);
    setUsersError(null);
    try {
      setUsers(await userService.listAssignees());
    } catch (err) {
      setUsersError(err.response?.data?.message || "No se pudieron cargar los responsables del plan.");
    } finally {
      setUsersLoading(false);
    }
  }, [canManage]);

  useEffect(() => { loadAssignees(); }, [loadAssignees]);

  async function handleSelectPlan(plan) {
    const version = ++actionVersion.current;
    setSelectedPlan(plan);
    setActionsLoading(true);
    setActionsError(null);
    try {
      const data = await mitigationActionService.listActionsByPlan(plan.id);
      if (actionVersion.current === version) setActions(data);
    } catch (err) {
      if (actionVersion.current === version) setActionsError(err.response?.data?.message || "No se pudieron cargar las acciones del plan.");
    } finally {
      if (actionVersion.current === version) setActionsLoading(false);
    }
  }

  async function handleCreatePlan(payload) {
    await mitigationPlanService.createPlan(riskId, payload);
    refresh();
  }

  if (!riskId) {
    return (
      <div className="mitigations-page">
        <PageHeader icon={ClipboardCheck} title="Mitigaciones" description="Gestiona los planes y las acciones para reducir la exposición a los riesgos." />
        <Card><div className="mitigation-entry"><span className="state-icon"><ShieldCheck size={38} /></span><h2>Selecciona un riesgo para comenzar</h2><p>Accede al detalle de un riesgo registrado para consultar sus planes de mitigación, responsables y acciones.</p><Link className="primary-button button-with-icon" to="/risks">Ver riesgos <ArrowRight size={18} /></Link></div></Card>
      </div>
    );
  }

  if (riskError) return <Card><ErrorState message={riskError} /></Card>;
  if (!risk) return <LoadingState variant="mitigations" />;

  return (
    <div className="mitigations-page">
      <PageHeader icon={ClipboardCheck} title="Planes de mitigación" description={risk.title} actions={<Link className="secondary-button button-with-icon" to={`/risks/${riskId}`}><ArrowLeft size={17} /> Volver al riesgo</Link>} />

      <Card title="Planes existentes" icon={ClipboardCheck} description="Selecciona un plan para consultar sus acciones.">
        {plansLoading ? <LoadingState variant="table" rows={4} columns={4} /> : plansError ? <ErrorState message="No se pudieron cargar los planes de mitigación." /> : plans.length === 0 ? (
          <EmptyState icon={ClipboardCheck} message="Este riesgo todavía no tiene planes de mitigación." />
        ) : (
          <MitigationPlanTable plans={plans} onSelect={handleSelectPlan} />
        )}
      </Card>

      <div className="mitigation-workspace">
      {canManage && (
        <Card title="Nuevo plan de mitigación" icon={Plus} description="Define el responsable y las fechas del plan.">
          <Alert type="error" message={usersError} />
          {usersError && <button type="button" className="secondary-button" onClick={loadAssignees}>Reintentar carga de responsables</button>}
          <MitigationPlanForm users={users} usersLoading={usersLoading} onSubmit={handleCreatePlan} />
        </Card>
      )}

      {selectedPlan && (
        <Card title="Acciones del plan" icon={ListChecks} description={selectedPlan.title}>
          {actionsLoading ? <LoadingState variant="list" rows={3} /> : actionsError ? <ErrorState message={actionsError} /> : <MitigationActionList actions={actions} />}
        </Card>
      )}
      </div>
    </div>
  );
}
