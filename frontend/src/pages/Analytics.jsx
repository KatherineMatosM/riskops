import { useState, useEffect } from "react";
import * as analyticsService from "../services/analyticsService";
import Card from "../components/common/Card";
import LoadingState from "../components/common/LoadingState";

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    analyticsService.getAnalytics().then(setAnalytics);
  }, []);

  if (!analytics) return <LoadingState />;

  return (
    <div className="analytics-page">
      <h2>Analisis Inteligente</h2>

      <Card title="Recomendaciones">
        {analytics.recommendations.length === 0 ? (
          <p className="empty-state">No hay suficientes datos para generar recomendaciones.</p>
        ) : (
          <ul className="insight-list">
            {analytics.recommendations.map((insight, index) => (
              <li key={index}>
                <strong>{insight.title}</strong>
                <p>{insight.description}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Categorias con mas riesgos">
        <ul>
          {analytics.top_categories.map((item) => (
            <li key={item.category}>{item.category}: {item.count}</li>
          ))}
        </ul>
      </Card>

      <Card title="Riesgos recurrentes">
        <ul>
          {analytics.recurring_risks.map((item) => (
            <li key={item.title}>{item.title}: {item.count} veces</li>
          ))}
        </ul>
      </Card>

      <Card title="Mitigaciones atrasadas">
        <ul>
          {analytics.overdue_mitigations.map((item) => (
            <li key={item.id}>{item.title} — vencio el {item.due_date}</li>
          ))}
        </ul>
      </Card>
    </div>
  );
}