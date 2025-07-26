import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Clock, Building, User } from 'lucide-react';
import { getStatusText, getStatusColor, getPriorityText, getPriorityColor } from '../../types';

const UserServiceOrders = () => {
  const { user, token } = useAuth();
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
      const response = await apiService.getServiceOrders({ limit: 10 }); // últimas ordens
      if (response?.serviceOrders) {
        setOrders(response.serviceOrders);
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
      await apiService.cancelServiceOrder(selectedOrderId, { reason: cancelReason });
      setCancelModalOpen(false);
      setCancelReason('');
      loadOrders();
    } catch (error) {
      console.error('Erro ao cancelar ordem:', error);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await apiService.updateServiceOrderStatus(id, { status });
      loadOrders();
    } catch (error) {
      console.error(`Erro ao atualizar status para ${status}:`, error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <p>Carregando ordens...</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Minhas Ordens de Serviço</h1>

      {orders.length === 0 ? (
        <p>Nenhuma ordem recente.</p>
      ) : (
        orders.map((order) => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{order.title}</h3>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusText(order.status)}
                    </Badge>
                    <Badge variant="outline" className={getPriorityColor(order.priority)}>
                      {getPriorityText(order.priority)}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-3">{order.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Criada: {formatDate(order.createdAt)}
                    </div>
                    {order.establishment && (
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" /> {order.establishment.name}
                      </div>
                    )}
                    {order.technician && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" /> Técnico: {order.technician.name}
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex flex-col gap-2 ml-4">
                  {order.status === 'open' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600"
                      onClick={() => {
                        setSelectedOrderId(order.id);
                        setCancelModalOpen(true);
                      }}
                    >
                      Cancelar
                    </Button>
                  )}
                  {order.status === 'in_progress' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateStatus(order.id, 'paused')}
                      >
                        Pausar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600"
                        onClick={() => handleUpdateStatus(order.id, 'completed')}
                      >
                        Confirmar Conclusão
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Modal Cancelamento */}
      {cancelModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Cancelar Ordem</h2>
            <textarea
              className="border rounded w-full p-2 mb-4"
              placeholder="Informe o motivo do cancelamento"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCancelModalOpen(false)}>
                Fechar
              </Button>
              <Button onClick={handleCancelOrder} className="bg-red-600 text-white">
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
