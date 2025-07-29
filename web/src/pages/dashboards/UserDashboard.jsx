import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { Button } from '../../components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ServiceOrderForm from '../../components/service-orders/ServiceOrderForm';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function UserDashboard() {
  const { user } = useAuth();
  const [establishmentOrders, setEstablishmentOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [cancelModal, setCancelModal] = useState({ open: false, orderId: null });
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    if (user?.establishmentId) {
      loadEstablishmentOrders();
      loadStats();
    }
  }, [user?.establishmentId]);

  async function loadEstablishmentOrders() {
    setLoading(true);
    try {
      const response = await apiService.getServiceOrders({
        establishmentId: user.establishmentId,
        t: Date.now(),
      });
      console.log('Ordens recebidas:', response);
      setEstablishmentOrders(response.serviceOrders || []);
    } catch (error) {
      console.error('Erro ao buscar ordens do estabelecimento:', error);
    }
    setLoading(false);
  }

  async function loadStats() {
    try {
      const response = await apiService.getServiceOrderStats({
        establishmentId: user.establishmentId,
      });
      console.log('Resposta ordens:', response);

      setStats(response.stats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  }

  // Somente ordens abertas do estabelecimento
  const openOrders = establishmentOrders.filter((o) =>
    ['open', 'in_progress'].includes(o.status.toLowerCase())
  );

  const statusLabels = {
    open: 'Abertas',
    assigned: 'Atribuídas',
    inProgress: 'Em Andamento',
    completed: 'Concluídas',
    confirmed: 'Confirmadas',
    cancelled: 'Canceladas',
  };

  const colors = {
    Abertas: '#FFC107',
    Atribuídas: '#2196F3',
    'Em Andamento': '#03A9F4',
    Concluídas: '#4CAF50',
    Confirmadas: '#009688',
    Canceladas: '#F44336',
  };

  const chartData = stats
    ? Object.entries(stats)
        .filter(([key]) => key !== 'total')
        .map(([key, value]) => ({
          name: statusLabels[key] || key,
          value: value,
        }))
    : [];

  const formatDate = (dateValue) => {
    if (!dateValue) return 'Data não disponível';

    if (dateValue._seconds) {
      return format(new Date(dateValue._seconds * 1000), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    }

    const date = new Date(dateValue);
    if (isNaN(date)) return 'Data inválida';

    return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

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
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={() => setShowModal(true)}
      >
        Nova Ordem
      </button>

      {/* Lista de ordens abertas do estabelecimento */}
      {/* Lista completa de ordens do estabelecimento, separadas por status */}
      <div className="bg-white rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Ordens do Estabelecimento</h2>

        {loading ? (
          <p>Carregando...</p>
        ) : establishmentOrders.length === 0 ? (
          <p>Nenhuma ordem encontrada para este estabelecimento.</p>
        ) : (
          Object.entries(
            establishmentOrders.reduce((groups, order) => {
              const status = order.status.toLowerCase();
              if (!groups[status]) groups[status] = [];
              groups[status].push(order);
              return groups;
            }, {})
          ).map(([status, orders]) => (
            <div key={status} className="mb-6">
              <h3 className="text-md font-semibold mb-2">
                {statusLabels[status] || status} ({orders.length})
              </h3>
              <ul className="space-y-2 border rounded p-3">
                {orders.map((order) => (
                  <li
                    key={order.id}
                    className="flex justify-between items-center border-b last:border-0 pb-2"
                  >
                    <div>
                      <p className="font-medium">{order.title}</p>
                      <small>
                        Criado em: {formatDate(order.createdAt)} | Prioridade: {order.priority}
                      </small>
                    </div>
                    {['open', 'in_progress'].includes(order.status.toLowerCase()) && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setCancelModal({ open: true, orderId: order.id })}
                      >
                        Cancelar
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>

      {/* Modal Nova Ordem */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded w-[500px]">
            <ServiceOrderForm
              onSuccess={() => {
                setShowModal(false);
                loadEstablishmentOrders();
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
