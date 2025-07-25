import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { Button } from '../../components/ui/button';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Plus } from 'lucide-react';

import ServiceOrderForm from '../../components/service-orders/ServiceOrderForm';

export default function UserDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Ano selecionado
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const [showModal, setShowModal] = useState(false);

  // Modal para cancelar
  const [cancelModal, setCancelModal] = useState({ open: false, orderId: null });
  const [cancelReason, setCancelReason] = useState('');

  // Modal para nova ordem
  const [newOrderModal, setNewOrderModal] = useState(false);
  const [newOrderTitle, setNewOrderTitle] = useState('');
  const [newOrderDesc, setNewOrderDesc] = useState('');

  const establishmentName = user?.establishmentName;

  useEffect(() => {
    if (establishmentName) loadOrders();
  }, [establishmentName]);

  async function loadOrders() {
    setLoading(true);
    try {
      const response = await apiService.getServiceOrders({ establishmentName });
      setOrders(response.data || []);
    } catch (error) {
      console.error('Erro ao buscar ordens:', error);
    }
    setLoading(false);
  }

  const openOrders = orders.filter((o) => ['OPEN', 'IN_PROGRESS'].includes(o.status));

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

  // Filtrar ordens pelo ano selecionado
  const ordersForYear = orders.filter((o) => {
    const year = new Date(o.createdAt).getFullYear();
    return year === selectedYear;
  });

  const monthlyData = months.map((month, index) => {
    const open = ordersForYear.filter(
      (o) =>
        ['OPEN', 'IN_PROGRESS'].includes(o.status) && new Date(o.createdAt).getMonth() === index
    ).length;
    const completed = ordersForYear.filter(
      (o) => o.status === 'COMPLETED' && new Date(o.createdAt).getMonth() === index
    ).length;
    const cancelled = ordersForYear.filter(
      (o) => o.status === 'CANCELLED' && new Date(o.createdAt).getMonth() === index
    ).length;

    return { month, Abertas: open, Concluidas: completed, Canceladas: cancelled };
  });

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

  async function handleCreateOrder() {
    if (!newOrderTitle || !newOrderDesc) return alert('Preencha título e descrição');
    try {
      await apiService.createServiceOrder({
        title: newOrderTitle,
        description: newOrderDesc,
        establishmentName,
        userName: user?.name || 'Usuário',
      });
      setNewOrderModal(false);
      setNewOrderTitle('');
      setNewOrderDesc('');
      loadOrders();
    } catch (error) {
      console.error('Erro ao criar ordem:', error);
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

      {/* Gráfico de Barras */}
      <div className="bg-white rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Ordens por Mês ({selectedYear})</h2>
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

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded"
        onClick={() => setShowModal(true)}
      >
        Nova Ordem
      </button>

      {/* Lista de ordens abertas */}
      <div className="bg-white rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Ordens em Aberto</h2>
        {loading ? (
          <p>Carregando...</p>
        ) : openOrders.length === 0 ? (
          <p>Nenhuma ordem em aberto.</p>
        ) : (
          <ul className="space-y-3">
            {openOrders.map((order) => (
              <li key={order.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium">{order.title}</p>
                  <small>Status: {order.status}</small>
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

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded w-[500px]">
            <ServiceOrderForm
              onSuccess={() => setShowModal(false)}
              onCancel={() => setShowModal(false)}
            />
          </div>
        </div>
      )}

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

      {/* Modal Nova Ordem */}
      {newOrderModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded p-6 w-96">
            <h3 className="font-bold mb-4">Nova Ordem</h3>
            <input
              type="text"
              className="border w-full p-2 mb-3"
              placeholder="Título"
              value={newOrderTitle}
              onChange={(e) => setNewOrderTitle(e.target.value)}
            />
            <textarea
              className="border w-full p-2 mb-3"
              rows="3"
              placeholder="Descrição"
              value={newOrderDesc}
              onChange={(e) => setNewOrderDesc(e.target.value)}
            />
            <p className="text-sm text-gray-500 mb-4">
              Estabelecimento: <strong>{establishmentName}</strong>
            </p>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setNewOrderModal(false)}>Cancelar</Button>
              <Button className="bg-blue-600 text-white" onClick={handleCreateOrder}>
                Criar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
