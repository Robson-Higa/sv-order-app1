import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import {
  UserType,
  ServiceOrderStatus,
  Priority,
  getStatusText,
  getStatusColor,
  getPriorityText,
  getPriorityColor,
} from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Clock,
  User,
  Building,
  RefreshCw,
} from 'lucide-react';
import '../App.css';

const ServiceOrdersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [establishments, setEstablishments] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [establishmentFilter, setEstablishmentFilter] = useState('all');
  const [technicianFilter, setTechnicianFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);
  useEffect(() => {
    async function loadTechnicians() {
      try {
        const response = await apiService.getTechnicians();
        console.log('Tecnicos:', response);
        if (response.data?.users) {
          setTechnicians(response.data.users);
        }
      } catch (error) {
        console.error('Erro ao carregar técnicos:', error);
      }
    }

    loadTechnicians();
  }, []);
  useEffect(() => {
    loadOrders();
  }, [searchTerm, statusFilter, priorityFilter, establishmentFilter, technicianFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersResponse, establishmentsResponse, techniciansResponse] = await Promise.all([
        loadOrders(),
        apiService.getEstablishments(),
        user?.userType === UserType.ADMIN
          ? apiService.getTechnicians()
          : Promise.resolve({ technicians: [] }),
      ]);

      if (establishmentsResponse.establishments) {
        setEstablishments(establishmentsResponse.establishments);
      }

      if (techniciansResponse.users) {
        setTechnicians(techniciansResponse.users);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    async function loadTechnicians() {
      try {
        const response = await apiService.getTechnicians();
        // Verifique o que exatamente está vindo em response
        console.log('Tecnicos:', response);

        if (response?.users) {
          setTechnicians(response.users);
        }
      } catch (error) {
        console.error('Erro ao carregar técnicos:', error);
      }
    }
    loadTechnicians();
  }, []);
  // Função auxiliar para pegar o nome do técnico pelo ID
  const getTechnicianNameById = (id) => {
    const technician = technicians.find((t) => t.id === id);
    return technician?.name || '';
  };

  const loadOrders = async () => {
    try {
      // Criar filtro apenas com os valores válidos para evitar enviar undefined explicitamente
      const filters = {
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter.toLowerCase() : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter.toUpperCase() : undefined,
        establishmentId: establishmentFilter !== 'all' ? establishmentFilter : undefined,
        technicianName:
          technicianFilter !== 'all'
            ? { technicianName: getTechnicianNameById(technicianFilter) }
            : {},
      };

      if (searchTerm && searchTerm.trim() !== '') {
        filters.search = searchTerm.trim();
      }
      if (statusFilter && statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      if (priorityFilter && priorityFilter !== 'all') {
        filters.priority = priorityFilter.toUpperCase();
      }
      if (establishmentFilter && establishmentFilter !== 'all') {
        filters.establishmentId = establishmentFilter;
      }
      if (technicianFilter && technicianFilter !== 'all') {
        filters.technicianId = technicianFilter;
      }

      console.log('Filtros para busca:', filters); // Ajuda a debug

      const response = await apiService.getServiceOrders(filters);

      if (response && response.serviceOrders) {
        setOrders(response.serviceOrders);
      } else {
        setOrders([]); // limpa se não houver dados
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]); // importante para limpar lista em erro
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setEstablishmentFilter('all');
    setTechnicianFilter('all');
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

  const canCreateOrder = () => {
    return user?.userType === UserType.END_USER || user?.userType === UserType.ADMIN;
  };

  const canEditOrder = (order) => {
    if (user?.userType === UserType.ADMIN) return true;
    if (user?.userType === UserType.TECHNICIAN && order.technicianId === user.id) return true;
    if (user?.userType === UserType.END_USER && order.userId === user.id) return true;
    return false;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-12 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ordens de Serviço</h1>
          <p className="text-gray-600 mt-1">Gerencie todas as ordens de serviço do sistema</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          {canCreateOrder() && (
            <Button onClick={() => navigate('/service-orders/new')}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Ordem
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar ordens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {Object.values(ServiceOrderStatus)
                  .filter((status) => status && status !== '')
                  .map((status) => (
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
                <SelectItem value="all">Todas as prioridades</SelectItem>
                {Object.values(Priority)
                  .filter((priority) => priority && priority !== '')
                  .map((priority) => (
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
                <SelectItem value="all">Todos os estabelecimentos</SelectItem>
                {establishments
                  .filter((e) => e.id && e.id !== '')
                  .map((establishment) => (
                    <SelectItem key={establishment.id} value={establishment.id}>
                      {establishment.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {user?.userType === UserType.ADMIN && (
              <Select value={technicianFilter} onValueChange={setTechnicianFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Técnico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os técnicos</SelectItem>
                  {technicians
                    .filter((t) => t.uid && t.uid !== '')
                    .map((technician) => (
                      <SelectItem key={technician.uid} value={technician.uid}>
                        {technician.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Limpar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma ordem encontrada</h3>
              <p className="text-gray-600 mb-4">
                Não há ordens de serviço que correspondam aos filtros selecionados.
              </p>
              {canCreateOrder() && (
                <Button onClick={() => navigate('/service-orders/new')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar primeira ordem
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{order.title}</h3>
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
                        <Clock className="w-4 h-4" />
                        <span>Criada: {formatDate(order.createdAt)}</span>
                      </div>

                      {order.establishment && (
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          <span>: {order.establishment.name}</span>
                        </div>
                      )}

                      {order.technician && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>Técnico: {order.technician.name}</span>
                        </div>
                      )}
                    </div>

                    {order.userRating && (
                      <div className="mt-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">Avaliação:</span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={`text-sm ${i < order.userRating ? 'text-yellow-400' : 'text-gray-300'}`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">({order.userRating}/5)</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/service-orders/${order.id}`)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>

                    {canEditOrder(order) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/service-orders/${order.id}/edit`)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}

                    {user?.userType === UserType.ADMIN && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => {
                          // TODO: Implement delete functionality
                          console.log('Delete order:', order.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination could be added here */}
      {orders.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          Mostrando {orders.length} ordem(ns) de serviço
        </div>
      )}
    </div>
  );
};

export default ServiceOrdersPage;
