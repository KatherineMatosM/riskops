import { useState, useEffect, useCallback } from "react";
import * as riskService from "../services/riskService";

export function useRisks(filters) {
  const [risks, setRisks] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, page_size: 20, total_pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRisks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await riskService.listRisks(filters);
      setRisks(data.items);
      setPagination({
        total: data.total, page: data.page, page_size: data.page_size, total_pages: data.total_pages,
      });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchRisks();
  }, [fetchRisks]);

  return { risks, pagination, loading, error, refresh: fetchRisks };
}