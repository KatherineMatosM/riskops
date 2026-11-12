import { useState } from "react";
import { FileBarChart2, Layers, ClipboardCheck, TriangleAlert, FileText, Loader2 } from "lucide-react";
import * as reportService from "../services/reportService";
import RiskTable from "../components/risks/RiskTable";
import MitigationPlanTable from "../components/mitigations/MitigationPlanTable";
import Card from "../components/common/Card";
import PageHeader from "../components/common/PageHeader";
import EmptyState from "../components/common/EmptyState";
import Alert from "../components/common/Alert";
import LoadingState from "../components/common/LoadingState";

export default function Reports() {
  const [risks, setRisks] = useState([]);
  const [mitigations, setMitigations] = useState([]);
  const [criticalRisks, setCriticalRisks] = useState([]);
  const [loading, setLoading] = useState({});
  const [generated, setGenerated] = useState({});
  const [errors, setErrors] = useState({});

  async function generateReport(key, request, onSuccess) {
    setLoading((current) => ({ ...current, [key]: true }));
    setErrors((current) => ({ ...current, [key]: "" }));
    try {
      const data = await request();
      onSuccess(data);
      setGenerated((current) => ({ ...current, [key]: true }));
    } catch {
      setErrors((current) => ({ ...current, [key]: "No se pudo generar el reporte. Inténtalo de nuevo." }));
    } finally {
      setLoading((current) => ({ ...current, [key]: false }));
    }
  }

  async function loadRisksReport() {
    await generateReport("risks", reportService.getRisksReport, setRisks);
  }

  async function loadMitigationsReport() {
    await generateReport("mitigations", reportService.getMitigationsReport, setMitigations);
  }

  async function loadCriticalReport() {
    await generateReport("critical", reportService.getCriticalRisksReport, setCriticalRisks);
  }

  function generateButton(key, onClick) {
    return <button className="secondary-button button-with-icon" onClick={onClick} disabled={loading[key]}>
      {loading[key] ? <Loader2 size={17} className="spin" aria-hidden="true" /> : <FileText size={17} aria-hidden="true" />}
      {loading[key] ? "Generando..." : generated[key] ? "Actualizar reporte" : "Generar reporte"}
    </button>;
  }

  return (
    <div className="reports-page">
      <PageHeader icon={FileBarChart2} title="Reportes" description="Genera y consulta la información clave para la gestión de riesgos." />

      <Card title="Riesgos" description="Estado, nivel y puntuación de todos los riesgos registrados." icon={Layers} actions={generateButton("risks", loadRisksReport)}>
        {errors.risks && <Alert type="error" message={errors.risks} />}
        {loading.risks ? <LoadingState variant="table" rows={4} columns={5} label="Generando reporte de riesgos..." /> : risks.length > 0 ? <RiskTable risks={risks} /> : <div className="report-placeholder"><EmptyState icon={FileBarChart2} message={generated.risks ? "No hay riesgos registrados para este reporte." : "Genera el reporte para consultar los riesgos registrados."} /></div>}
      </Card>

      <Card title="Mitigaciones" description="Seguimiento del estado, avance y fecha límite de los planes." icon={ClipboardCheck} actions={generateButton("mitigations", loadMitigationsReport)}>
        {errors.mitigations && <Alert type="error" message={errors.mitigations} />}
        {loading.mitigations ? <LoadingState variant="table" rows={4} columns={4} label="Generando reporte de mitigaciones..." /> : mitigations.length > 0 ? <MitigationPlanTable plans={mitigations} onSelect={() => {}} /> : <div className="report-placeholder"><EmptyState icon={ClipboardCheck} message={generated.mitigations ? "No hay planes de mitigación para este reporte." : "Genera el reporte para consultar los planes de mitigación."} /></div>}
      </Card>

      <Card title="Riesgos críticos" description="Riesgos de mayor exposición que requieren atención prioritaria." icon={TriangleAlert} actions={generateButton("critical", loadCriticalReport)}>
        {errors.critical && <Alert type="error" message={errors.critical} />}
        {loading.critical ? <LoadingState variant="table" rows={4} columns={5} label="Generando reporte de riesgos críticos..." /> : criticalRisks.length > 0 ? <RiskTable risks={criticalRisks} /> : <div className="report-placeholder"><EmptyState icon={TriangleAlert} message={generated.critical ? "No hay riesgos críticos para este reporte." : "Genera el reporte para identificar los riesgos críticos."} /></div>}
      </Card>
    </div>
  );
}
