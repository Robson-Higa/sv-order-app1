import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Clock, Building, User } from 'lucide-react';
import { getStatusText, getPriorityText } from '../../types';

const gradientStatusColors = {
  open: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white',
  in_progress: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white',
  completed: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white',
  cancelled: 'bg-gradient-to-r from-red-500 to-pink-600 text-white',
};

const gradientPriorityColors = {
  HIGH: 'bg-gradient-to-r from-red-400 to-red-600 text-white',
  MEDIUM: 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white',
  LOW: 'bg-gradient-to-r from-green-400 to-teal-500 text-white',
};

// ✅ Corrige Firestore Timestamp
const formatDate = (dateValue) => {
  if (!dateValue) return 'Data indisponível';
  let date;

  if (dateValue._seconds) {
    date = new Date(dateValue._seconds * 1000);
  } else if (typeof dateValue.toDate === 'function') {
    date = dateValue.toDate();
  } else {
    date = new Date(dateValue);
  }

  if (isNaN(date.getTime())) return 'Data inválida';

  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const UserServiceOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await apiService.getServiceOrders({ scope: 'mine', limit: 10 });
      if (response?.serviceOrders) {
        const sortedOrders = [...response.serviceOrders].sort((a, b) => {
          const dateA = a.createdAt._seconds
            ? a.createdAt._seconds
            : new Date(a.createdAt).getTime() / 1000;
          const dateB = b.createdAt._seconds
            ? b.createdAt._seconds
            : new Date(b.createdAt).getTime() / 1000;
          return dateB - dateA; // Mais recentes primeiro
        });
        setOrders(sortedOrders);
      }
    } catch (error) {
      console.error('Erro ao carregar ordens:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) return alert('Informe um motivo para cancelamento.');
    try {
      await apiService.cancelServiceOrder(selectedOrderId, cancelReason);
      setCancelModalOpen(false);
      setCancelReason('');
      loadOrders();
    } catch (error) {
      console.error('Erro ao cancelar ordem:', error);
    }
  };

  if (loading) {
    return <p className="text-center text-gray-500">Carregando ordens...</p>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4">
      <h1 className="text-3xl font-extrabold mb-6 text-gray-900">Minhas Ordens de Serviço</h1>

      {orders.length === 0 ? (
        <p className="text-center text-gray-600">Nenhuma ordem recente.</p>
      ) : (
        orders.map((order) => (
          <Card
            key={order.id}
            className="hover:shadow-lg transition-shadow rounded-lg border border-gray-200"
          >
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-800">{order.title}</h3>
                    <Badge
                      className={`${gradientStatusColors[order.status] || 'bg-gray-300'} shadow-md`}
                    >
                      {getStatusText(order.status)}
                    </Badge>
                    <Badge
                      className={`${gradientPriorityColors[order.priority] || 'bg-gray-200'} shadow-inner`}
                    >
                      {getPriorityText(order.priority)}
                    </Badge>
                  </div>
                  <p className="text-gray-700 mb-4">{order.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-400" /> Criada:{' '}
                      {formatDate(order.createdAt)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="w-5 h-5 text-gray-400" /> {order.establishmentName}
                    </div>
                    {order.technicianName && (
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-gray-400" /> Técnico: {order.technicianName}
                      </div>
                    )}
                  </div>
                </div>

                {/* Botão Cancelar */}
                {order.status === 'open' && (
                  <Button
                    className="bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 shadow-md"
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      setCancelModalOpen(true);
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Modal Cancelamento */}
      {cancelModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Cancelar Ordem</h2>
            <textarea
              className="border border-gray-300 rounded-md w-full p-3 mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-pink-400"
              rows={4}
              placeholder="Informe o motivo do cancelamento"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setCancelModalOpen(false)}>
                Fechar
              </Button>
              <Button
                className="bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 shadow-md"
                onClick={handleCancelOrder}
              >
                Cancelar Ordem
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserServiceOrders;
