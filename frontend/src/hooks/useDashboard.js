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

  const fetchAll = useCallback(async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { summary, byLevel, byCategory, byStatus, trend, mitigationsByStatus, loading, refresh: fetchAll };
}