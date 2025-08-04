import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { UserType, getStatusText, getStatusColor } from '../../types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  ClipboardList,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Building,
  TrendingUp,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../../App.css';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [statsResponse, recentResponse] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getRecentOrders(),
      ]);

      if (statsResponse.stats) {
        const stats = statsResponse.stats;
        setStats({
          totalOrders: stats.totalOrders || 0,
          openOrders: stats.openOrders || 0,
          assignedOrders: stats.assignedOrders || 0,
          inProgressOrders: stats.inProgressOrders || 0,
          completedOrders: stats.completedOrders || 0,
          totalUsers: stats.totalUsers || 0,
          totalEstablishments: stats.totalEstablishments || 0,
        });
      }

      if (recentResponse.orders) {
        setRecentOrders(recentResponse.orders);
      } else {
        setRecentOrders([]);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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
        value: stats.totalOrders || 0,
        icon: ClipboardList,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
      },
      {
        title: 'Em Aberto',
        value: stats.openOrders || 0,
        icon: Clock,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
      },
      {
        title: 'Em Progresso',
        value: stats.inProgressOrders || 0,
        icon: AlertCircle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
      },
      {
        title: 'Concluídas',
        value: stats.completedOrders || 0,
        icon: CheckCircle,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
      },
    ];

    if (user?.userType === UserType.ADMIN) {
      baseCards.push(
        {
          title: 'Total de Usuários',
          value: stats.totalUsers || 0,
          icon: Users,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
        },
        {
          title: 'Estabelecimentos',
          value: stats.totalEstablishments || 0,
          icon: Building,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50',
        }
      );
    }

    if (user?.userType === UserType.TECHNICIAN) {
      baseCards.push({
        title: 'Atribuídas a Mim',
        value: stats.assignedOrders || 0,
        icon: TrendingUp,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
      });
    }

    return baseCards;
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-gray-600 mt-1">Aqui está um resumo das atividades</p>
        </div>

        {user?.userType === UserType.END_USER && (
          <Button onClick={() => navigate('/service-orders/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Ordem
          </Button>
        )}
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
                    <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                    <p className="text-2xl font-bold mt-2">{card.value}</p>
                  </div>
                  <div className={`p-3 rounded-full bg-primary/10`}>
                    <Icon className={`w-6 h-6 text-primary`} />
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
                  className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-accent/20 cursor-pointer transition-colors"
                  onClick={() => navigate(`/service-orders/${order.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-medium">{order.title}</h4>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusText(order.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {order.description?.substring(0, 100)}
                      {order.description?.length > 100 && '...'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Criada em: {formatDate(order.createdAt)}</span>
                      {order.establishment && <span>ESF: {order.establishment.name}</span>}
                      {order.technician && <span>Técnico: {order.technician.name}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card
          className="cursor-pointer hover:shadow-lg transition-all border-l-blue-600"
          onClick={() => navigate('/service-orders')}
        >
          <CardContent className="p-6 text-center">
            <ClipboardList className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-medium mb-1">Gerenciar Ordens</h3>
            <p className="text-sm text-muted-foreground">
              Visualizar e gerenciar todas as ordens de serviço
            </p>
          </CardContent>
        </Card>

        {user?.userType === UserType.ADMIN && (
          <>
            <Card
              className="cursor-pointer hover:shadow-lg transition-all border-l-blue-600"
              onClick={() => navigate('/users')}
            >
              <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-medium mb-1">Gerenciar Usuários</h3>
                <p className="text-sm text-muted-foreground">
                  Adicionar e gerenciar usuários do sistema
                </p>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:shadow-lg transition-all border-l-blue-600"
              onClick={() => navigate('/reports')}
            >
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-8 h-8 text-primary mx-auto mb-3" />
                <h3 className="font-medium mb-1">Relatórios</h3>
                <p className="text-sm text-muted-foreground">
                  Visualizar relatórios e análises do sistema
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {user?.userType === UserType.END_USER && (
          <Card
            className="cursor-pointer hover:shadow-lg transition-all border-l-blue-600"
            onClick={() => navigate('/service-orders/new')}
          >
            <CardContent className="p-6 text-center">
              <Plus className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-medium mb-1">Nova Ordem</h3>
              <p className="text-sm text-muted-foreground">Criar uma nova ordem de serviço</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
