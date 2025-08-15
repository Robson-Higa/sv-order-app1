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
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
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
  const [titles, setTitles] = useState([
    { title: 'Título 1' },
    { title: 'Título 2' },
    { title: 'Título 3' },
  ]);
  const [title, setTitle] = useState('');

  // Modais
  const [modalAction, setModalAction] = useState(null); // cancel, pause, confirm
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    loadData();
    loadTitles(); // carrega títulos junto
  }, []);

  useEffect(() => {
    loadOrders();
  }, [statusFilter, priorityFilter, establishmentFilter, technicianFilter, searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersResp, estResp, usersResp] = await Promise.all([
        apiService.getServiceOrders(),
        apiService.getEstablishments(),
        apiService.getUsers(), // pega todos os usuários
      ]);

      setOrders(ordersResp.serviceOrders || []);
      setEstablishments(estResp.establishments || []);
      setTechnicians((usersResp.users || []).filter((u) => u.userType === 'technician'));
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const filters = {
        title: title.trim() || undefined,
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

  const loadTitles = async () => {
    try {
      const response = await apiService.getTitles(); // Você precisa ter esse método no apiService
      setTitles(response.titles || []);
    } catch (error) {
      console.error('Erro ao carregar títulos:', error);
    }
  };
  const handleAction = async (action, reason = '') => {
    if (!selectedOrder) return;

    try {
      const payload = { status: '', reason: reason.trim() };

      switch (action) {
        case 'cancel':
          payload.status = 'CANCELLED';
          break;
        case 'pause':
          payload.status = 'PAUSED';
          break;
        case 'reactivate':
          payload.status = 'IN_PROGRESS';
          delete payload.reason;
          break;
        case 'confirm':
          payload.status = 'COMPLETED';
          delete payload.reason;
          break;
        default:
          return;
      }

      await apiService.updateStatus(selectedOrder.id, payload);

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

  const resetFilters = () => {
    setStatusFilter('all');
    setPriorityFilter('all');
    setEstablishmentFilter('all');
    setTechnicianFilter('all');
    setTitle(''); // limpa Autocomplete
    setSearchTerm('');
    loadOrders(); // recarrega todas as ordens
  };
  const statusLabels = {
    OPEN: 'Aberta',
    IN_PROGRESS: 'Em andamento',
    PAUSED: 'Pausada',
    open: 'Aberta',
    in_progress: 'Em andamento',
    paused: 'Pausada',
    COMPLETED: 'Concluída',
    completed: 'Concluída',
    CANCELLED: 'Cancelada',
    cancelled: 'Cancelada',
  };

  const getStatusText = (status) => statusLabels[status] || status;

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

  useEffect(() => {
    if (title) {
      console.log('Título selecionado ou digitado:', title);
      // Aqui você pode disparar uma busca, filtro ou carregar dados conforme o título
      // ex: fetchData(title);
    }
  }, [title]);

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
          {/* Campo de busca */}
          <div>
            <label className="block mb-1 text-sm font-medium">Buscar</label>
            <Autocomplete
              options={titles}
              getOptionLabel={(option) =>
                typeof option === 'string' ? option : option.title || ''
              }
              value={title || null}
              onChange={(_, newValue) => {
                let val = '';
                if (typeof newValue === 'string') {
                  val = newValue;
                } else if (newValue && newValue.title) {
                  val = newValue.title;
                }
                setTitle(val);
                setSearchTerm(val); // <--- adiciona aqui para filtrar na busca
                loadOrders();
              }}
              freeSolo
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Selecione ou digite o título"
                  variant="outlined"
                  size="small"
                />
              )}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block mb-1 text-sm font-medium">Status</label>
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
          </div>

          {/* Prioridade */}
          <div>
            <label className="block mb-1 text-sm font-medium">Prioridade</label>
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
          </div>

          {/* Estabelecimento */}
          <div>
            <label className="block mb-1 text-sm font-medium">Estabelecimento</label>
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
          </div>

          {/* Técnico */}
          <div>
            <label className="block mb-1 text-sm font-medium">Técnico</label>
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
          </div>

          {/* Botão de limpar filtros */}
          <div className="flex items-end justify-start">
            <Button variant="outline" className="w-full md:w-auto" onClick={resetFilters}>
              Limpar Filtros
            </Button>
          </div>
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
        [...orders]
          .sort((a, b) => {
            const dateA = a.createdAt?._seconds
              ? a.createdAt._seconds * 1000
              : new Date(a.createdAt).getTime();
            const dateB = b.createdAt?._seconds
              ? b.createdAt._seconds * 1000
              : new Date(b.createdAt).getTime();
            return dateB - dateA;
          })
          .map((order) => (
            <Card
              key={order.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/service-orders/${order.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{order.title}</h3>
                    <p className="text-gray-600">{order.description}</p>
                    {order.status === 'CANCELLED' && order.cancelReason && (
                      <p className="text-red-600 text-sm mt-2">
                        Motivo do cancelamento: {order.cancelReason}
                      </p>
                    )}

                    {order.status === 'PAUSED' && order.pauseReason && (
                      <p className="text-yellow-600 text-sm mt-2">
                        Motivo da pausa: {order.pauseReason}
                      </p>
                    )}
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
                <div
                  className="flex gap-3"
                  onClick={(e) => e.stopPropagation()} // Impede navegação ao clicar nos botões
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className={order.status === 'PAUSED' ? 'text-green-600' : 'text-yellow-600'}
                    onClick={() => {
                      setSelectedOrder(order);
                      setModalAction(order.status === 'PAUSED' ? 'reactivate' : 'pause');
                    }}
                    disabled={order.status === 'CANCELLED' || order.status === 'COMPLETED'}
                  >
                    {order.status === 'PAUSED' ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-1" /> Reativar
                      </>
                    ) : (
                      <>
                        <PauseCircle className="w-4 h-4 mr-1" /> Pausar
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600"
                    onClick={() => {
                      setSelectedOrder(order);
                      setModalAction('cancel');
                    }}
                    disabled={
                      order.status === 'PAUSED' ||
                      order.status === 'CANCELLED' ||
                      order.status === 'COMPLETED'
                    }
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
                    disabled={
                      order.status === 'PAUSED' ||
                      order.status === 'CANCELLED' ||
                      order.status === 'COMPLETED'
                    }
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
