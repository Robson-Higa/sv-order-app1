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

  const loadOrders = async () => {
    try {
      const filters = {
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter.toLowerCase() : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter.toUpperCase() : undefined,
        establishmentId: establishmentFilter !== 'all' ? establishmentFilter : undefined,
        technicianId: technicianFilter !== 'all' ? technicianFilter : undefined,
      };

      // Limpa filtros vazios
      Object.keys(filters).forEach((key) => filters[key] === undefined && delete filters[key]);

      const response = await apiService.getServiceOrders(filters);

      if (response?.serviceOrders) {
        setOrders(response.serviceOrders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      setOrders([]);
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

  // Efeito para carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Carrega dados em paralelo
        const [ordersResponse, establishmentsResponse] = await Promise.all([
          loadOrders(),
          apiService.getEstablishments(),
        ]);

        // Carrega técnicos apenas se for admin
        if (user?.userType === UserType.ADMIN) {
          try {
            const techniciansResponse = await apiService.getTechnicians();
            if (techniciansResponse?.data?.users) {
              setTechnicians(techniciansResponse.data.users);
            }
          } catch (error) {
            console.error('Erro ao carregar técnicos:', error);
          }
        }

        if (establishmentsResponse?.establishments) {
          setEstablishments(establishmentsResponse.establishments);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user?.userType]);

  // Efeito para recarregar ordens quando filtros mudam
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const user = await checkAuth();
        if (!user) throw new Error('Authentication required');

        const orders = await apiService.getServiceOrders({
          userType: user.userType,
          userId: user.userId,
        });

        setOrders(orders);
      } catch (error) {
        console.error('Order load error:', error);
        setError(error.error || error.message);
      }
    };
  });

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

  console.log('User type:', user?.userType);
  console.log('Token exists:', !!localStorage.getItem('token'));

  // Resto do seu JSX permanece igual...
  return <div className="space-y-6">{/* Seu conteúdo JSX existente */}</div>;
};

export default ServiceOrdersPage;
