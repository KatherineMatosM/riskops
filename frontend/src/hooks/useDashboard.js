import { useState, useEffect, useCallback } from "react";
import * as dashboardService from "../services/dashboardService";

export function useDashboard() {
  const [summary, setSummary] = useState(null);
  const [byLevel, setByLevel] = useState([]);
  const [byCategory, setByCategory] = useState([]);
  const [byStatus, setByStatus] = useState([]);
  const [trend, setTrend] = useState([]);
  const [mitigationsByStatus, setMitigationsByStatus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [summaryData, levelData, categoryData, statusData, trendData, mitigationData] = await Promise.all([
        dashboardService.getSummary(),
        dashboardService.getRisksByLevel(),
        dashboardService.getRisksByCategory(),
        dashboardService.getRisksByStatus(),
        dashboardService.getRiskTrend(),
        dashboardService.getMitigationsByStatus(),
      ]);
      setSummary(summaryData);
      setByLevel(levelData);
      setByCategory(categoryData);
      setByStatus(statusData);
      setTrend(trendData);
      setMitigationsByStatus(mitigationData);
    } catch (err) {
      setError(err.response?.data?.message || "No se pudo cargar el resumen de riesgos. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { summary, byLevel, byCategory, byStatus, trend, mitigationsByStatus, loading, error, refresh: fetchAll };
}
