import React, { useState, useEffect } from 'react';
import { checkAuth } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { UserType } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { CardDescription } from '@/components/ui/card';
import {
  ClipboardList,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  Building,
  TrendingUp,
  Plus,
  RefreshCw,
} from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificar autenticação
      const token = localStorage.getItem('token');
      if (!token || !user) {
        throw new Error('Faça login para acessar o dashboard');
      }

      // Add API service validation
      if (!apiService?.dashboard) {
        throw new Error('Serviço de dashboard não disponível');
      }

      // Carregar dados em paralelo com tratamento de erros individual
      const [statsResponse, recentResponse] = await Promise.all([
        apiService.dashboard.getStats?.().catch((e) => {
          console.error('Failed to load stats:', e);
          return { stats: null };
        }),
        apiService.dashboard.getRecentOrders?.().catch((e) => {
          console.error('Failed to load recent orders:', e);
          return { recentOrders: null };
        }),
      ]);

      // Verificar respostas com mais detalhes
      if (!statsResponse || !statsResponse.stats) {
        throw new Error('Dados estatísticos não disponíveis');
      }

      if (!recentResponse || !recentResponse.recentOrders) {
        console.warn('Ordens recentes não disponíveis');
      }

      // Definir estados com valores padrão seguros
      setStats({
        totalOrders: statsResponse.stats.totalOrders ?? 0,
        openOrders: statsResponse.stats.openOrders ?? 0,
        assignedOrders: statsResponse.stats.assignedOrders ?? 0,
        inProgressOrders: statsResponse.stats.inProgressOrders ?? 0,
        completedOrders: statsResponse.stats.completedOrders ?? 0,
        totalUsers: statsResponse.stats.totalUsers ?? 0,
        totalEstablishments: statsResponse.stats.totalEstablishments ?? 0,
      });

      setRecentOrders(recentResponse.recentOrders ?? []);
    } catch (error) {
      // ... (keep your existing error handling)
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]); // Recarrega quando o usuário muda

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getStatsCards = () => {
    if (!stats) return [];

    const baseCards = [
      {
        title: 'Total de Ordens',
        value: stats.totalOrders,
        icon: ClipboardList,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
      },
      {
        title: 'Em Aberto',
        value: stats.openOrders,
        icon: Clock,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
      },
      {
        title: 'Em Progresso',
        value: stats.inProgressOrders,
        icon: AlertCircle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
      },
      {
        title: 'Concluídas',
        value: stats.completedOrders,
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
      },
    ];

    if (user?.userType === UserType.ADMIN) {
      baseCards.push(
        {
          title: 'Total de Usuários',
          value: stats.totalUsers,
          icon: Users,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
        },
        {
          title: 'Estabelecimentos',
          value: stats.totalEstablishments,
          icon: Building,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50',
        }
      );
    }

    if (user?.userType === UserType.TECHNICIAN) {
      baseCards.push({
        title: 'Atribuídas a Mim',
        value: stats.assignedOrders,
        icon: TrendingUp,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
      });
    }

    return baseCards;
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Erro ao carregar dashboard</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button variant="outline" onClick={loadDashboardData}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-gray-600 mt-1">Aqui está um resumo das suas atividades</p>
        </div>

        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {getStatsCards().map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${card.bgColor}`}>
                    <Icon className={`w-6 h-6 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ordens Recentes</CardTitle>
              <CardDescription>Últimas ordens de serviço do sistema</CardDescription>
            </div>
            <Button variant="outline" onClick={() => navigate('/service-orders')}>
              Ver todas
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma ordem encontrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.slice(0, 5).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/service-orders/${order.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium text-gray-900">{order.title}</h4>
                      <Badge>{order.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {order.description?.substring(0, 100)}
                      {order.description?.length > 100 && '...'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Criada em: {formatDate(order.createdAt)}</span>
                      {order.establishment && <span>Local: {order.establishment.name}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
