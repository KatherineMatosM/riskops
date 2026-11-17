import { useState, useEffect, useCallback, useRef } from "react";
import * as riskService from "../services/riskService";

export function useRisks(filters) {
  const [risks, setRisks] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, page_size: 20, total_pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestVersion = useRef(0);
  const filtersKey = JSON.stringify(filters);

  const fetchRisks = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setError(null);
    try {
      const data = await riskService.listRisks(JSON.parse(filtersKey));
      if (requestVersion.current !== version) return;
      setRisks(data.items);
      setPagination({
        total: data.total, page: data.page, page_size: data.page_size, total_pages: data.total_pages,
      });
    } catch (err) {
      if (requestVersion.current === version) setError(err);
    } finally {
      if (requestVersion.current === version) setLoading(false);
    }
  }, [filtersKey]);

  useEffect(() => {
    fetchRisks();
    return () => { requestVersion.current += 1; };
  }, [fetchRisks]);

  return { risks, pagination, loading, error, refresh: fetchRisks };
}
