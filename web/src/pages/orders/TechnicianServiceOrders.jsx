import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Clock, Building, User, CheckCircle } from 'lucide-react';
import FinishOrderModal from './components/FinishOrderModal';

const TechnicianServiceOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showFinishModal, setShowFinishModal] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await apiService.getServiceOrders({ technicianName: user.name });
      if (response?.serviceOrders) {
        setOrders(response.serviceOrders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Erro ao carregar ordens:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const handleFinishOrder = async (id, notes) => {
    try {
      await apiService.updateStatus(id, 'PENDING_CONFIRMATION', notes);
      setShowFinishModal(false);
      setSelectedOrder(null);
      await loadOrders();
    } catch (error) {
      console.error('Erro ao finalizar ordem:', error);
      alert('Não foi possível finalizar a ordem.');
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
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Minhas Ordens de Serviço</h1>
        <Button onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </div>

      {/* Lista de ordens */}
      {orders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-gray-500">
            Nenhuma ordem atribuída a você.
          </CardContent>
        </Card>
      ) : (
        orders.map((order) => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{order.title}</h3>
                  <p className="text-gray-600">{order.description}</p>
                </div>
                <Badge className="bg-blue-500 text-white">{order.status}</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Criada: {formatDate(order.createdAt)}
                </div>
                {order.establishment && (
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    {order.establishment.name}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Cliente: {order.userName || 'N/A'}
                </div>
              </div>

              {/* Ações */}
              {order.status === 'IN_PROGRESS' && (
                <div className="flex gap-2">
                  <Button
                    className="bg-green-600 text-white"
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowFinishModal(true);
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Finalizar Ordem
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}

      {showFinishModal && (
        <FinishOrderModal
          onClose={() => setShowFinishModal(false)}
          onConfirm={(notes) => handleFinishOrder(selectedOrder.id, notes)}
        />
      )}
    </div>
  );
};

export default TechnicianServiceOrders;
