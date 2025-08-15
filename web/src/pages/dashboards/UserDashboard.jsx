import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useServiceOrders } from '../../hooks/useServiceOrders';
import { apiService } from '../../services/api';
import { Button } from '../../components/ui/button';
import ServiceOrderForm from '../../components/service-orders/ServiceOrderForm';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function UserDashboard() {
  const { user } = useAuth();
  const {
    orders: establishmentOrders,
    loading,
    reload,
  } = useServiceOrders({ scope: 'establishment' });

  const [stats, setStats] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (user?.establishmentId) {
      loadStats();
      loadMonthlyStats();
    }
  }, [user?.establishmentId]);

  async function loadStats() {
    try {
      const res = await apiService.getServiceOrderStats({ establishmentId: user.establishmentId });
      setStats(res.stats);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadMonthlyStats() {
    try {
      const res = await apiService.getMonthlyServiceOrderStats({
        establishmentId: user.establishmentId,
      });
      setMonthlyData(res.data || []);
    } catch (err) {
      console.error(err);
    }
  }

  const statusLabels = {
    open: 'Aberta',
    assigned: 'Atribuída',
    in_progress: 'Em Andamento',
    completed: 'Concluída',
    confirmed: 'Confirmada',
    cancelled: 'Cancelada',
    paused: 'Pausado',
    OPEN: 'Aberta',
    ASSIGNED: 'Atribuída',
    IN_PROGRESS: 'Em Andamento',
    COMPLETED: 'Concluída',
    CONFIRMED: 'Confirmada',
    CANCELLED: 'Cancelada',
    PAUSED: 'Pausado',
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Bem-vindo, {user?.name}</h1>

      {/* Cards de Totais */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-blue-100 p-4 rounded shadow text-center">
            <p className="text-lg font-bold text-blue-700">{stats.open || 0}</p>
            <p className="text-sm text-blue-600">Abertas</p>
          </div>
          <div className="bg-green-100 p-4 rounded shadow text-center">
            <p className="text-lg font-bold text-green-700">{stats.completed || 0}</p>
            <p className="text-sm text-green-600">Concluídas</p>
          </div>
          <div className="bg-red-100 p-4 rounded shadow text-center">
            <p className="text-lg font-bold text-red-700">{stats.cancelled || 0}</p>
            <p className="text-sm text-red-600">Canceladas</p>
          </div>
        </div>
      )}

      {/* Gráfico de Últimos 12 Meses */}
      <div className="bg-white rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Evolução das Ordens (Últimos 12 meses)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData}>
            <XAxis dataKey="month" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="open" name="Abertas" stroke="#3B82F6" strokeWidth={2} />
            <Line
              type="monotone"
              dataKey="completed"
              name="Concluídas"
              stroke="#10B981"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="cancelled"
              name="Canceladas"
              stroke="#EF4444"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Botão Nova Ordem */}
      <Button className="bg-blue-600 text-white" onClick={() => setShowModal(true)}>
        Nova Ordem
      </Button>

      {/* Lista de Ordens */}
      <div className="bg-white rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Ordens do Estabelecimento</h2>
        {loading ? (
          <p>Carregando...</p>
        ) : establishmentOrders.length === 0 ? (
          <p>Nenhuma ordem encontrada.</p>
        ) : (
          establishmentOrders.map((order) => (
            <div key={order.id} className="border-b py-2 flex justify-between">
              <span>{order.title}</span>
              <span className="font-semibold">{statusLabels[order.status] || order.status}</span>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded w-[500px]">
            <ServiceOrderForm
              onSuccess={() => {
                setShowModal(false);
                reload();
                loadStats();
                loadMonthlyStats();
              }}
              onCancel={() => setShowModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
