import { useState, useEffect } from 'react';

// ou o caminho correto para o arquivo

export function useServiceOrders(filters = {}) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getServiceOrders({ limit: 1000 }); // pegue um número maior se precisar
      if (response?.serviceOrders) {
        let filteredOrders = response.serviceOrders;

        if (filters.userId) {
          filteredOrders = filteredOrders.filter((order) => order.userId === filters.userId);
        }

        if (filters.establishmentId) {
          filteredOrders = filteredOrders.filter(
            (order) => order.establishment?.id === filters.establishmentId
          );
        }

        setOrders(filteredOrders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      setError(err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [JSON.stringify(filters)]);

  return { orders, loading, error, reload: loadOrders };
}
