import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useServiceOrders } from '../../hooks/useServiceOrders';
import { apiService } from '../../services/api';
import { Button } from '../../components/ui/button';
import ServiceOrderForm from '../../components/service-orders/ServiceOrderForm';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function UserDashboard() {
  const { user } = useAuth();
  const {
    orders: establishmentOrders,
    loading,
    error,
    reload,
  } = useServiceOrders({
    scope: 'establishment',
  });

  const [stats, setStats] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (user?.establishmentId) loadStats();
  }, [user?.establishmentId]);

  async function loadStats() {
    try {
      const res = await apiService.getServiceOrderStats({
        establishmentId: user.establishmentId,
      });
      setStats(res.stats);
    } catch (err) {
      console.error(err);
    }
  }

  const statusLabels = {
    open: 'Abertas',
    assigned: 'Atribuídas',
    in_progress: 'Em Andamento',
    completed: 'Concluídas',
    confirmed: 'Confirmadas',
    cancelled: 'Canceladas',
  };

  const chartData = stats
    ? Object.entries(stats)
        .filter(([key]) => key !== 'total')
        .map(([key, value]) => ({ name: statusLabels[key] || key, value }))
    : [];

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Bem-vindo, {user?.name}</h1>

      {/* Gráfico */}
      <div className="bg-white rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Estatísticas do Estabelecimento</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#8884d8" />
          </BarChart>
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
              <span>Status: {order.status}</span>
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
              }}
              onCancel={() => setShowModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
