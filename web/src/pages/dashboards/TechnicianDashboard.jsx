import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { Button } from '../../components/ui/button';

export default function TechnicianDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [completeModal, setCompleteModal] = useState({ open: false, orderId: null });
  const [serviceDescription, setServiceDescription] = useState('');

  useEffect(() => {
    if (user?.uid) loadOrders();
  }, [user]);

  async function loadOrders() {
    setLoading(true);
    try {
      const response = await apiService.getServiceOrders({ technicianName: user.name });
      setOrders(response.data || []);
    } catch (error) {
      console.error('Erro ao buscar ordens do técnico:', error);
    }
    setLoading(false);
  }

  const assignedOrders = orders.filter((o) => ['IN_PROGRESS', 'OPEN'].includes(o.status));

  async function handleCompleteOrder() {
    if (!serviceDescription) return alert('Informe a descrição!');
    try {
      await apiService.updateStatus(completeModal.orderId, 'COMPLETED', serviceDescription);
      setCompleteModal({ open: false, orderId: null });
      setServiceDescription('');
      loadOrders();
    } catch (error) {
      console.error('Erro ao finalizar ordem:', error);
    }
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Minhas Ordens</h1>

      <div className="bg-white rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Ordens Atribuídas</h2>
        {loading ? (
          <p>Carregando...</p>
        ) : assignedOrders.length === 0 ? (
          <p>Nenhuma ordem atribuída.</p>
        ) : (
          <ul className="space-y-3">
            {assignedOrders.map((order) => (
              <li key={order.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium">{order.title}</p>
                  <small>Status: {order.status}</small>
                </div>
                <Button
                  variant="success"
                  onClick={() => setCompleteModal({ open: true, orderId: order.id })}
                >
                  Finalizar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal Finalização */}
      {completeModal.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded p-6 w-96">
            <h3 className="font-bold mb-4">Finalizar Ordem</h3>
            <textarea
              className="border w-full p-2 mb-4"
              rows="3"
              placeholder="Descreva o serviço realizado"
              value={serviceDescription}
              onChange={(e) => setServiceDescription(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button onClick={() => setCompleteModal({ open: false, orderId: null })}>
                Fechar
              </Button>
              <Button className="bg-green-500 text-white" onClick={handleCompleteOrder}>
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
