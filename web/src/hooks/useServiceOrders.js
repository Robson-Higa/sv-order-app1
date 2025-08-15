import { useEffect, useState, useCallback } from 'react';
import { apiService } from '../services/api';

export function useServiceOrders(filters = {}) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getServiceOrders(filters);

      setOrders(response.serviceOrders || []);
    } catch (err) {
      console.error('Erro ao buscar ordens:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, error, reload: fetchOrders };
}
