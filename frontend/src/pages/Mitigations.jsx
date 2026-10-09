import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
import { ROLES } from "../utils/constants";

export default function Mitigations() {
  const [searchParams] = useSearchParams();
  const riskId = searchParams.get("risk_id");
  const { hasRole } = useAuth();
  const [risk, setRisk] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [actions, setActions] = useState([]);
  const { plans, refresh } = useMitigations(riskId);

  useEffect(() => {
    if (riskId) {
      riskService.getRisk(riskId).then(setRisk);
    }
    if (hasRole(ROLES.ADMIN, ROLES.RISK_MANAGER)) {
      userService.listUsers().then(setUsers).catch(() => setUsers([]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [riskId]);

  async function handleSelectPlan(plan) {
    setSelectedPlan(plan);
    const data = await mitigationActionService.listActionsByPlan(plan.id);
    setActions(data);
  }

  async function handleCreatePlan(payload) {
    await mitigationPlanService.createPlan(riskId, payload);
    refresh();
  }

  if (!riskId) {
    return (
      <div className="mitigations-page">
        <h2>Planes de mitigacion</h2>
        <p>Selecciona un riesgo desde su detalle para gestionar sus planes de mitigacion.</p>
      </div>
    );
  }

  if (!risk) return <LoadingState />;

  return (
    <div className="mitigations-page">
      <h2>Planes de mitigacion — {risk.title}</h2>

      <Card title="Planes existentes">
        {plans.length === 0 ? (
          <p className="empty-state">Este riesgo no tiene planes de mitigacion.</p>
        ) : (
          <MitigationPlanTable plans={plans} onSelect={handleSelectPlan} />
        )}
      </Card>

      {hasRole(ROLES.ADMIN, ROLES.RISK_MANAGER, ROLES.ANALYST) && (
        <Card title="Nuevo plan de mitigacion">
          <MitigationPlanForm users={users} onSubmit={handleCreatePlan} />
        </Card>
      )}

      {selectedPlan && (
        <Card title={`Acciones del plan: ${selectedPlan.title}`}>
          <MitigationActionList actions={actions} />
        </Card>
      )}
    </div>
  );
}