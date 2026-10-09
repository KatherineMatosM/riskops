import { useState } from "react";
import * as reportService from "../services/reportService";
import RiskTable from "../components/risks/RiskTable";
import MitigationPlanTable from "../components/mitigations/MitigationPlanTable";
import Card from "../components/common/Card";

export default function Reports() {
  const [risks, setRisks] = useState([]);
  const [mitigations, setMitigations] = useState([]);
  const [criticalRisks, setCriticalRisks] = useState([]);

  async function loadRisksReport() {
    const data = await reportService.getRisksReport();
    setRisks(data);
  }

  async function loadMitigationsReport() {
    const data = await reportService.getMitigationsReport();
    setMitigations(data);
  }

  async function loadCriticalReport() {
    const data = await reportService.getCriticalRisksReport();
    setCriticalRisks(data);
  }

  return (
    <div className="reports-page">
      <h2>Reportes</h2>

      <Card title="Riesgos" actions={<button className="link-button" onClick={loadRisksReport}>Generar</button>}>
        {risks.length > 0 && <RiskTable risks={risks} />}
      </Card>

      <Card title="Mitigaciones" actions={<button className="link-button" onClick={loadMitigationsReport}>Generar</button>}>
        {mitigations.length > 0 && <MitigationPlanTable plans={mitigations} onSelect={() => {}} />}
      </Card>

      <Card title="Riesgos criticos" actions={<button className="link-button" onClick={loadCriticalReport}>Generar</button>}>
        {criticalRisks.length > 0 && <RiskTable risks={criticalRisks} />}
      </Card>
    </div>
  );
}