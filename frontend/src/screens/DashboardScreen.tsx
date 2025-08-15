import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../contexts/AuthContext';
import { UserType, DashboardStats, TechnicianStats, AdminStats, ServiceOrder } from '../types';
import { apiService } from '../services/api';

interface DashboardData {
  stats: DashboardStats | TechnicianStats | AdminStats;
  recentOrders?: ServiceOrder[];
  activeOrders?: ServiceOrder[];
}

const DashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await apiService.getDashboardData();
      setDashboardData({
        stats: response.stats!,
        recentOrders: response.recentOrders,
        activeOrders: response.activeOrders,
      });
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os dados do dashboard');
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const renderStatsCard = (title: string, value: number, icon: string, color: string) => (
    <View style={[styles.statsCard, { borderLeftColor: color }]}>
      <View style={styles.statsContent}>
        <View style={styles.statsText}>
          <Text style={styles.statsTitle}>{title}</Text>
          <Text style={styles.statsValue}>{value}</Text>
        </View>
        <Icon name={icon} size={32} color={color} />
      </View>
    </View>
  );

  const renderOrderItem = (order: ServiceOrder) => (
    <TouchableOpacity key={order.id} style={styles.orderItem}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderTitle}>{order.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
          <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
        </View>
      </View>
      <Text style={styles.orderDescription} numberOfLines={2}>
        {order.description}
      </Text>
      <View style={styles.orderFooter}>
        <Text style={styles.orderDate}>
          {new Date(order.createdAt).toLocaleDateString('pt-BR')}
        </Text>
        {order.establishment && (
          <Text style={styles.orderEstablishment}>{order.establishment.name}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return '#ffc107';
      case 'assigned': return '#17a2b8';
      case 'in_progress': return '#007bff';
      case 'completed': return '#28a745';
      case 'confirmed': return '#6f42c1';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Aberta';
      case 'assigned': return 'Atribuída';
      case 'in_progress': return 'Em Progresso';
      case 'completed': return 'Concluída';
      case 'confirmed': return 'Confirmada';
      case 'cancelled': return 'Cancelada';
      default: return status;
    }
  };

  const renderGreeting = () => {
    const hour = new Date().getHours();
    let greeting = 'Boa noite';
    if (hour < 12) greeting = 'Bom dia';
    else if (hour < 18) greeting = 'Boa tarde';

    return (
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>
          {greeting}, {user?.name}!
        </Text>
        <Text style={styles.greetingSubtext}>
          {user?.userType === UserType.ADMIN && 'Painel Administrativo'}
          {user?.userType === UserType.TECHNICIAN && 'Painel do Técnico'}
          {user?.userType === UserType.END_USER && 'Suas Ordens de Serviço'}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Carregando dashboard...</Text>
      </View>
    );
  }

  if (!dashboardData) {
    return (
      <View style={styles.errorContainer}>
        <Text>Erro ao carregar dados</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadDashboardData}>
          <Text style={styles.retryButtonText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { stats, recentOrders, activeOrders } = dashboardData;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {renderGreeting()}

      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Estatísticas</Text>
        <View style={styles.statsGrid}>
          {renderStatsCard('Total de Ordens', stats.totalOrders, 'assignment', '#007bff')}
          {renderStatsCard('Abertas', stats.openOrders, 'assignment-late', '#ffc107')}
          {renderStatsCard('Em Progresso', stats.inProgressOrders, 'assignment-turned-in', '#17a2b8')}
          {renderStatsCard('Concluídas', stats.completedOrders, 'assignment-turned-in', '#28a745')}
        </View>

        {user?.userType === UserType.ADMIN && (
          <View style={styles.statsGrid}>
            {renderStatsCard('Usuários', (stats as AdminStats).totalUsers, 'people', '#6f42c1')}
            {renderStatsCard('Técnicos', (stats as AdminStats).totalTechnicians, 'engineering', '#fd7e14')}
            {renderStatsCard('Estabelecimentos', (stats as AdminStats).totalEstablishments, 'business', '#20c997')}
          </View>
        )}

        {user?.userType === UserType.TECHNICIAN && (
          <View style={styles.statsGrid}>
            {renderStatsCard('Atribuídas', (stats as TechnicianStats).assignedOrders, 'assignment-ind', '#17a2b8')}
            {renderStatsCard('Taxa de Conclusão', Math.round((stats as TechnicianStats).completionRate), 'trending-up', '#28a745')}
          </View>
        )}
      </View>

      {activeOrders && activeOrders.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ordens Ativas</Text>
          {activeOrders.map(renderOrderItem)}
        </View>
      )}

      {recentOrders && recentOrders.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ordens Recentes</Text>
          {recentOrders.slice(0, 5).map(renderOrderItem)}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#007bff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  greeting: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  greetingSubtext: {
    fontSize: 16,
    color: '#666',
  },
  statsContainer: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statsCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  statsContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsText: {
    flex: 1,
  },
  statsTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
  },
  orderItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  orderDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
  },
  orderEstablishment: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: '500',
  },
});

export default DashboardScreen;

