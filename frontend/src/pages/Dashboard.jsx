import {
  Boxes, ShieldAlert, TriangleAlert, CircleAlert, CircleCheck,
  FolderOpen, Archive, ClipboardList, Clock,
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

export default function Dashboard() {
  const { summary, byLevel, byCategory, byStatus, trend, mitigationsByStatus, loading } = useDashboard();

  if (loading || !summary) {
    return <LoadingState label="Cargando dashboard..." />;
  }

  return (
    <div className="dashboard-page">
      <div className="stats-grid">
        <StatCard label="Total de riesgos" value={summary.total_risks} icon={Boxes} />
        <StatCard label="Criticos" value={summary.critical_risks} accent="#c62828" icon={ShieldAlert} />
        <StatCard label="Altos" value={summary.high_risks} accent="#ef6c00" icon={TriangleAlert} />
        <StatCard label="Medios" value={summary.medium_risks} accent="#f9a825" icon={CircleAlert} />
        <StatCard label="Bajos" value={summary.low_risks} accent="#2e7d32" icon={CircleCheck} />
        <StatCard label="Abiertos" value={summary.open_risks} icon={FolderOpen} />
        <StatCard label="Cerrados" value={summary.closed_risks} icon={Archive} />
        <StatCard label="Planes activos" value={summary.active_mitigation_plans} icon={ClipboardList} />
        <StatCard label="Planes atrasados" value={summary.overdue_mitigation_plans} accent="#c62828" icon={Clock} />
      </div>

      <div className="charts-grid">
        <Card title="Riesgos por nivel"><RiskByLevelChart data={byLevel} /></Card>
        <Card title="Riesgos por categoria"><RiskByCategoryChart data={byCategory} /></Card>
        <Card title="Riesgos por estado"><RiskByStatusChart data={byStatus} /></Card>
        <Card title="Evolucion temporal"><RiskTrendChart data={trend} /></Card>
        <Card title="Mitigaciones por estado"><MitigationStatusChart data={mitigationsByStatus} /></Card>
      </div>
    </div>
  );
}