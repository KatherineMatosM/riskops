import { useState, useEffect, useCallback } from "react";
import * as mitigationPlanService from "../services/mitigationPlanService";

export function useMitigations(riskId) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPlans = useCallback(async () => {
    if (!riskId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await mitigationPlanService.listPlansByRisk(riskId);
      setPlans(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [riskId]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return { plans, loading, error, refresh: fetchPlans };
}