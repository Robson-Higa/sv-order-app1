import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';

export function useTechnicianStats(technicianId) {
  const [stats, setStats] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    if (!technicianId) return;
    try {
      setLoading(true);
      const res = await apiService.getServiceOrderStats({ technicianId });
      setStats(res.stats);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    } finally {
      setLoading(false);
    }
  }, [technicianId]);

  const loadMonthlyStats = useCallback(async () => {
    if (!technicianId) return;
    try {
      const res = await apiService.getMonthlyServiceOrderStats({ technicianId });
      setMonthlyData(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar estatísticas mensais:', err);
    }
  }, [technicianId]);

  const reload = useCallback(() => {
    loadStats();
    loadMonthlyStats();
  }, [loadStats, loadMonthlyStats]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { stats, monthlyData, loading, reload };
}
