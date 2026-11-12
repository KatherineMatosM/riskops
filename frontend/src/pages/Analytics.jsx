import { useState, useEffect } from "react";
import { Sparkles, Layers, Clock, Target, BarChart3, RefreshCw, ShieldCheck, ClipboardList } from "lucide-react";
import * as analyticsService from "../services/analyticsService";
import Card from "../components/common/Card";
import LoadingState from "../components/common/LoadingState";
import ErrorState from "../components/common/ErrorState";
import EmptyState from "../components/common/EmptyState";
import PageHeader from "../components/common/PageHeader";
import StatCard from "../components/dashboard/StatCard";
import { formatDate } from "../utils/formatters";

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    analyticsService.getAnalytics().then(setAnalytics).catch(() => setError("No se pudo cargar el análisis de riesgos. Inténtalo de nuevo más tarde."));
  }, []);

  const maxCategoryCount = Math.max(1, ...(analytics?.top_categories || []).map((item) => item.count));

  return (
    <div className="analytics-page">
      <PageHeader icon={Sparkles} title="Análisis inteligente" description="Identifica prioridades y patrones a partir de los riesgos registrados." />
      {error ? <Card><ErrorState message={error} /></Card> : !analytics ? <LoadingState variant="analytics" label="Preparando el análisis de riesgos..." /> : <>
      <div className="stats-grid">
        <StatCard label="Categorías destacadas" value={analytics.top_categories.length} icon={Layers} />
        <StatCard label="Planes atrasados" value={analytics.overdue_mitigations.length} icon={Clock} accent="#d97706" />
        <StatCard label="Riesgos recurrentes" value={analytics.recurring_risks.length} icon={RefreshCw} accent="#238669" />
      </div>
      <div className="analytics-grid">
      <Card title="Recomendaciones" description="Hallazgos que orientan tus próximas decisiones." icon={Target}>
        {analytics.recommendations.length === 0 ? (
          <EmptyState message="No hay suficientes datos para generar recomendaciones." icon={Sparkles} />
        ) : (
          <ul className="insight-list">
            {analytics.recommendations.map((insight, index) => (
              <li key={index} className="insight-item">
                <span className="insight-icon"><Sparkles size={21} aria-hidden="true" /></span>
                <div className="insight-content">
                <strong>{insight.title}</strong>
                <p>{insight.description}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Categorías con más riesgos" description="Concentración de riesgos por área." icon={BarChart3}>
        {analytics.top_categories.length === 0 ? <EmptyState message="Todavía no hay categorías con riesgos registrados." icon={Layers} /> : <ol className="category-ranking">
          {analytics.top_categories.map((item, index) => (
            <li key={item.category}>
              <span className="category-rank">{index + 1}</span>
              <span className="category-name">{item.category}</span>
              <span className="category-bar" aria-hidden="true"><span style={{ width: `${(item.count / maxCategoryCount) * 100}%` }} /></span>
              <strong className="category-count">{item.count}</strong>
            </li>
          ))}
        </ol>}
      </Card>

      <Card title="Riesgos recurrentes" description="Riesgos que aparecen en más de un registro." icon={RefreshCw}>
        {analytics.recurring_risks.length === 0 ? <EmptyState message="No se detectaron riesgos recurrentes." icon={ShieldCheck} /> : <ul className="insight-list">
          {analytics.recurring_risks.map((item) => (
            <li key={item.title} className="analytics-list-item"><span>{item.title}</span><span className="status-badge">{item.count} veces</span></li>
          ))}
        </ul>}
      </Card>

      <Card title="Mitigaciones atrasadas" description="Planes vencidos que requieren seguimiento." icon={ClipboardList}>
        {analytics.overdue_mitigations.length === 0 ? <EmptyState message="No hay planes de mitigación atrasados." icon={ShieldCheck} /> : <ul className="insight-list">
          {analytics.overdue_mitigations.map((item) => (
            <li key={item.id} className="analytics-list-item"><strong>{item.title}</strong><span className="overdue-date"><Clock size={15} aria-hidden="true" /> Venció el {formatDate(item.due_date)}</span></li>
          ))}
        </ul>}
      </Card>
      </div>
      </>}
    </div>
  );
}
