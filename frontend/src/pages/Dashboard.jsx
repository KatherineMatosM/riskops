import {
  Boxes, ShieldAlert, TriangleAlert, CircleAlert, CircleCheck,
  FolderOpen, Archive, ClipboardList, Clock, LayoutDashboard, Layers, Activity, RefreshCw,
} from "lucide-react";
import { useDashboard } from "../hooks/useDashboard";
import StatCard from "../components/dashboard/StatCard";
import RiskByLevelChart from "../components/dashboard/RiskByLevelChart";
import RiskByCategoryChart from "../components/dashboard/RiskByCategoryChart";
import RiskByStatusChart from "../components/dashboard/RiskByStatusChart";
import RiskTrendChart from "../components/dashboard/RiskTrendChart";
import MitigationStatusChart from "../components/dashboard/MitigationStatusChart";
import Card from "../components/common/Card";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import PageHeader from "../components/common/PageHeader";

export default function Dashboard() {
  const { summary, byLevel, byCategory, byStatus, trend, mitigationsByStatus, loading, error, refresh } = useDashboard();

  return (
    <div className="dashboard-page">
      <PageHeader icon={LayoutDashboard} title="Dashboard" description="Una visión general de tus riesgos y el avance de su gestión." />
      {loading ? <LoadingState variant="dashboard" label="Cargando dashboard..." /> : error || !summary ? (
        <Card>
          <ErrorState message={error || "No se pudo cargar el resumen de riesgos."} />
          <div className="state-actions"><button className="secondary-button button-with-icon" onClick={refresh}><RefreshCw size={17} /> Reintentar</button></div>
        </Card>
      ) : <>
      <div className="stats-grid dashboard-summary">
        <StatCard label="Total de riesgos" value={summary.total_risks} icon={Boxes} />
        <StatCard label="Riesgos críticos" value={summary.critical_risks} accent="#dc3545" icon={ShieldAlert} />
        <StatCard label="Planes activos" value={summary.active_mitigation_plans} accent="#2458d3" icon={ClipboardList} />
        <StatCard label="Planes atrasados" value={summary.overdue_mitigation_plans} accent="#d97706" icon={Clock} />
      </div>
      <div className="stats-grid dashboard-secondary-stats">
        <StatCard label="Altos" value={summary.high_risks} accent="#ef6c00" icon={TriangleAlert} />
        <StatCard label="Medios" value={summary.medium_risks} accent="#f9a825" icon={CircleAlert} />
        <StatCard label="Bajos" value={summary.low_risks} accent="#2e7d32" icon={CircleCheck} />
        <StatCard label="Abiertos" value={summary.open_risks} icon={FolderOpen} />
        <StatCard label="Cerrados" value={summary.closed_risks} icon={Archive} />
      </div>

      <div className="charts-grid dashboard-charts">
        <Card title="Riesgos por nivel" description="Distribución según el nivel de exposición." icon={ShieldAlert}><RiskByLevelChart data={byLevel} /></Card>
        <Card title="Estado de mitigaciones" description="Seguimiento de los planes de tratamiento." icon={ClipboardList}><MitigationStatusChart data={mitigationsByStatus} /></Card>
        <Card title="Riesgos por categoría" description="Identifica las áreas con mayor concentración de riesgos." icon={Layers}><RiskByCategoryChart data={byCategory} /></Card>
        <Card title="Riesgos por estado" description="Situación actual de los riesgos registrados." icon={Activity}><RiskByStatusChart data={byStatus} /></Card>
        <Card title="Evolución temporal" description="Comportamiento de los riesgos a lo largo del tiempo." icon={Activity} className="chart-wide"><RiskTrendChart data={trend} /></Card>
      </div>
      </>}
    </div>
  );
}
