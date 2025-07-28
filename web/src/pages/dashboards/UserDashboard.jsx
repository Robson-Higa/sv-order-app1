import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { Button } from '../../components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

import ServiceOrderForm from '../../components/service-orders/ServiceOrderForm';

export default function UserDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const [showModal, setShowModal] = useState(false);

  const [cancelModal, setCancelModal] = useState({ open: false, orderId: null });
  const [cancelReason, setCancelReason] = useState('');

  const establishmentName = user?.establishmentName;

  useEffect(() => {
    if (user?.uid && user?.establishmentId) {
      loadOrders();
      loadEstablishmentOrders();
    }
  }, [user?.uid, user?.establishmentId]);

  // const [orders, setOrders] = useState([]); // ordens do usuário
  const [establishmentOrders, setEstablishmentOrders] = useState([]); // ordens do estabelecimento

  useEffect(() => {
    if (user?.uid && user?.establishmentId) {
      loadOrders();
      loadEstablishmentOrders();
    }
  }, [user?.uid, user?.establishmentId]);

  async function loadOrders() {
    setLoading(true);
    try {
      // Somente ordens do usuário
      const response = await apiService.getServiceOrders({ userId: user.uid });

      setOrders(response.serviceOrders || []);
    } catch (error) {
      console.error('Erro ao buscar ordens do usuário:', error);
    }
    setLoading(false);
  }

  async function loadEstablishmentOrders() {
    try {
      // Buscar ordens do estabelecimento
      const response = await apiService.getServiceOrders({
        establishmentId: user.establishmentId,
      });
      setEstablishmentOrders(response.serviceOrders || []);
    } catch (error) {
      console.error('Erro ao buscar ordens do estabelecimento:', error);
    }
  }

  // Ordens do estabelecimento do usuário (filtra pelo nome do estabelecimento)
  // Além disso, elimina ordens que não tenham userId definido (caso queira)
  const ordersForEstablishment = establishmentOrders;

  // Ordens criadas pelo usuário logado
  const userOrders = orders.filter((o) => o.userId === user?.uid);

  // Ordens abertas do usuário para mostrar no card
  const openUserOrders = userOrders.filter((o) =>
    ['open', 'in_progress'].includes(o.status.toLowerCase())
  );

  const months = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ];

  // ORDENS PARA O GRÁFICO - só as do estabelecimento
  const ordersForYear = ordersForEstablishment.filter((o) => {
    const date = o.createdAt?.seconds
      ? new Date(o.createdAt.seconds * 1000)
      : new Date(o.createdAt);
    return date.getFullYear() === selectedYear;
  });

  const monthlyData = months.map((month, index) => {
    const open = ordersForYear.filter(
      (o) =>
        ['open', 'in_progress'].includes(o.status.toLowerCase()) &&
        (o.createdAt?.seconds
          ? new Date(o.createdAt.seconds * 1000).getMonth() === index
          : new Date(o.createdAt).getMonth() === index)
    ).length;

    const completed = ordersForYear.filter(
      (o) =>
        o.status.toLowerCase() === 'completed' &&
        (o.createdAt?.seconds
          ? new Date(o.createdAt.seconds * 1000).getMonth() === index
          : new Date(o.createdAt).getMonth() === index)
    ).length;

    const cancelled = ordersForYear.filter(
      (o) =>
        o.status.toLowerCase() === 'cancelled' &&
        (o.createdAt?.seconds
          ? new Date(o.createdAt.seconds * 1000).getMonth() === index
          : new Date(o.createdAt).getMonth() === index)
    ).length;

    return { month, Abertas: open, Concluidas: completed, Canceladas: cancelled };
  });

  // Formatação de datas para cards
  const formatDate = (date) => {
    if (!date) return '-';
    if (date._seconds || date.seconds) {
      const secs = date._seconds ?? date.seconds;
      return new Date(secs * 1000).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  async function handleCancelOrder() {
    if (!cancelReason) return alert('Informe o motivo!');
    try {
      await apiService.updateStatus(cancelModal.orderId, 'CANCELLED', cancelReason);
      setCancelModal({ open: false, orderId: null });
      setCancelReason('');
      loadOrders();
    } catch (error) {
      console.error('Erro ao cancelar ordem:', error);
    }
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Bem-vindo, {user?.name}</h1>

      {/* Filtro de Ano */}
      <div className="flex justify-end mb-4">
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="border rounded px-3 py-1"
        >
          {[currentYear, currentYear - 1, currentYear - 2].map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      {/* Gráfico */}
      <div className="bg-white rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-4">
          Ordens do Estabelecimento por Mês ({selectedYear})
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Abertas" fill="#FFC107" />
            <Bar dataKey="Concluidas" fill="#4CAF50" />
            <Bar dataKey="Canceladas" fill="#F44336" />
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

      {/* Lista de ordens abertas do usuário */}
      <div className="bg-white rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Ordens em Aberto (Minhas)</h2>
        {loading ? (
          <p>Carregando...</p>
        ) : openUserOrders.length === 0 ? (
          <p>Nenhuma ordem em aberto.</p>
        ) : (
          <ul className="space-y-3">
            {openUserOrders.map((order) => (
              <li key={order.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium">{order.title}</p>
                  <small>
                    Status: {order.status} | Criado em: {formatDate(order.createdAt)}
                  </small>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setCancelModal({ open: true, orderId: order.id })}
                >
                  Cancelar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal Nova Ordem */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded w-[500px]">
            <ServiceOrderForm
              onSuccess={() => {
                setShowModal(false);
                loadOrders();
              }}
              onCancel={() => setShowModal(false)}
            />
          </div>
        </div>
      )}

      {/* Modal Cancelamento */}
      {cancelModal.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded p-6 w-96">
            <h3 className="font-bold mb-4">Cancelar Ordem</h3>
            <textarea
              className="border w-full p-2 mb-4"
              rows="3"
              placeholder="Informe o motivo"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button onClick={() => setCancelModal({ open: false, orderId: null })}>Fechar</Button>
              <Button className="bg-red-500 text-white" onClick={handleCancelOrder}>
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
