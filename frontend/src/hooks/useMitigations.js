import { useState, useEffect, useCallback, useRef } from "react";
import * as mitigationPlanService from "../services/mitigationPlanService";

export function useMitigations(riskId) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestVersion = useRef(0);

  const fetchPlans = useCallback(async () => {
    const version = ++requestVersion.current;
    if (!riskId) {
      setPlans([]);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await mitigationPlanService.listPlansByRisk(riskId);
      if (requestVersion.current === version) setPlans(data);
    } catch (err) {
      if (requestVersion.current === version) setError(err);
    } finally {
      if (requestVersion.current === version) setLoading(false);
    }
  }, [riskId]);

  useEffect(() => {
    fetchPlans();
    return () => { requestVersion.current += 1; };
  }, [fetchPlans]);

  return { plans, loading, error, refresh: fetchPlans };
}
