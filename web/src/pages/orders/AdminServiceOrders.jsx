import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import {
  ServiceOrderStatus,
  Priority,
  getStatusText,
  getStatusColor,
  getPriorityText,
  getPriorityColor,
} from '../../types';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Plus,
  Search,
  Filter,
  Clock,
  Building,
  User,
  RefreshCw,
  PauseCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import ActionModal from './components/ActionModal';

const AdminServiceOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [establishments, setEstablishments] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filtros
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [establishmentFilter, setEstablishmentFilter] = useState('all');
  const [technicianFilter, setTechnicianFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modais
  const [modalAction, setModalAction] = useState(null); // cancel, pause, confirm
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadOrders();
  }, [statusFilter, priorityFilter, establishmentFilter, technicianFilter, searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersResp, estResp, techResp] = await Promise.all([
        apiService.getServiceOrders(),
        apiService.getEstablishments(),
        apiService.getTechnicians(),
      ]);

      setOrders(ordersResp.serviceOrders || []);
      setEstablishments(estResp.establishments || []);
      setTechnicians(techResp.users || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const filters = {
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        establishmentId: establishmentFilter !== 'all' ? establishmentFilter : undefined,
        technicianId: technicianFilter !== 'all' ? technicianFilter : undefined,
      };

      const response = await apiService.getServiceOrders(filters);
      setOrders(response.serviceOrders || []);
    } catch (error) {
      console.error('Erro ao buscar ordens:', error);
    }
  };

  const handleAction = async (action, reason = '') => {
    try {
      if (!selectedOrder) return;

      if (action === 'cancel') {
        await apiService.updateStatus(selectedOrder.id, 'CANCELLED', reason);
      } else if (action === 'pause') {
        await apiService.updateStatus(selectedOrder.id, 'PAUSED', reason);
      } else if (action === 'confirm') {
        await apiService.updateStatus(selectedOrder.id, 'COMPLETED');
      }

      setModalAction(null);
      setSelectedOrder(null);
      await loadOrders();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Não foi possível atualizar a ordem.');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return <div className="text-center py-8">Carregando ordens...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Ordens de Serviço</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={() => navigate('/service-orders/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Ordem
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" /> Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input
            placeholder="Buscar por título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {Object.values(ServiceOrderStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {getStatusText(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {Object.values(Priority).map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {getPriorityText(priority)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={establishmentFilter} onValueChange={setEstablishmentFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Estabelecimento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {establishments.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={technicianFilter} onValueChange={setTechnicianFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Técnico" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {technicians.map((t) => (
                <SelectItem key={t.uid} value={t.uid}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Lista de ordens */}
      {orders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-gray-500">
            Nenhuma ordem encontrada.
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
                <div className="flex gap-2">
                  <Badge className={getStatusColor(order.status)}>
                    {getStatusText(order.status)}
                  </Badge>
                  <Badge variant="outline" className={getPriorityColor(order.priority)}>
                    {getPriorityText(order.priority)}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" /> {formatDate(order.createdAt)}
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

              {/* Botões de Ação */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-yellow-600"
                  onClick={() => {
                    setSelectedOrder(order);
                    setModalAction('pause');
                  }}
                >
                  <PauseCircle className="w-4 h-4 mr-1" /> Pausar
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600"
                  onClick={() => {
                    setSelectedOrder(order);
                    setModalAction('cancel');
                  }}
                >
                  <XCircle className="w-4 h-4 mr-1" /> Cancelar
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="text-green-600"
                  onClick={() => {
                    setSelectedOrder(order);
                    setModalAction('confirm');
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-1" /> Confirmar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Modal para ações */}
      {modalAction && (
        <ActionModal
          action={modalAction}
          onClose={() => setModalAction(null)}
          onConfirm={handleAction}
        />
      )}
    </div>
  );
};

export default AdminServiceOrders;
