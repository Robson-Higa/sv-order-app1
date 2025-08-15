import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Picker } from '@react-native-picker/picker';

import { useAuth } from '../contexts/AuthContext';
import { ServiceOrder, ServiceOrderStatus, UserType, Establishment } from '../types';
import { apiService } from '../services/api';

const ServiceOrdersScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [establishmentFilter, setEstablishmentFilter] = useState('');

  useEffect(() => {
    loadData();
  }, [statusFilter, establishmentFilter]);

  const loadData = async () => {
    try {
      const [ordersResponse, establishmentsResponse] = await Promise.all([
        apiService.getServiceOrders({
          status: statusFilter || undefined,
          establishmentId: establishmentFilter || undefined,
        }),
        apiService.getEstablishments(),
      ]);

      if (ordersResponse.serviceOrders) {
        setServiceOrders(ordersResponse.serviceOrders);
      }

      if (establishmentsResponse.establishments) {
        setEstablishments(establishmentsResponse.establishments);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar as ordens de serviço');
      console.error('Erro ao carregar ordens:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleOrderPress = (orderId: string) => {
    navigation.navigate('ServiceOrderDetails', { orderId });
  };

  const handleCreateOrder = () => {
    navigation.navigate('CreateServiceOrder');
  };

  const getStatusColor = (status: ServiceOrderStatus) => {
    switch (status) {
      case ServiceOrderStatus.OPEN: return '#ffc107';
      case ServiceOrderStatus.ASSIGNED: return '#17a2b8';
      case ServiceOrderStatus.IN_PROGRESS: return '#007bff';
      case ServiceOrderStatus.COMPLETED: return '#28a745';
      case ServiceOrderStatus.CONFIRMED: return '#6f42c1';
      case ServiceOrderStatus.CANCELLED: return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status: ServiceOrderStatus) => {
    switch (status) {
      case ServiceOrderStatus.OPEN: return 'Aberta';
      case ServiceOrderStatus.ASSIGNED: return 'Atribuída';
      case ServiceOrderStatus.IN_PROGRESS: return 'Em Progresso';
      case ServiceOrderStatus.COMPLETED: return 'Concluída';
      case ServiceOrderStatus.CONFIRMED: return 'Confirmada';
      case ServiceOrderStatus.CANCELLED: return 'Cancelada';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgente';
      case 'high': return 'Alta';
      case 'medium': return 'Média';
      case 'low': return 'Baixa';
      default: return priority;
    }
  };

  const filteredOrders = serviceOrders.filter(order =>
    order.title.toLowerCase().includes(searchText.toLowerCase()) ||
    order.description.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderOrderItem = ({ item }: { item: ServiceOrder }) => (
    <TouchableOpacity
      style={styles.orderItem}
      onPress={() => handleOrderPress(item.id)}
    >
      <View style={styles.orderHeader}>
        <Text style={styles.orderTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <View style={styles.badges}>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
            <Text style={styles.badgeText}>{getPriorityText(item.priority)}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.orderDescription} numberOfLines={2}>
        {item.description}
      </Text>

      <View style={styles.orderInfo}>
        <View style={styles.infoRow}>
          <Icon name="business" size={16} color="#666" />
          <Text style={styles.infoText}>
            {item.establishment?.name || 'Estabelecimento não informado'}
          </Text>
        </View>

        {item.technician && (
          <View style={styles.infoRow}>
            <Icon name="person" size={16} color="#666" />
            <Text style={styles.infoText}>{item.technician.name}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Icon name="schedule" size={16} color="#666" />
          <Text style={styles.infoText}>
            {new Date(item.createdAt).toLocaleDateString('pt-BR')}
          </Text>
        </View>
      </View>

      <View style={styles.orderFooter}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
        
        {item.orderNumber && (
          <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar ordens..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <View style={styles.filterRow}>
        <View style={styles.filterItem}>
          <Text style={styles.filterLabel}>Status:</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={statusFilter}
              onValueChange={setStatusFilter}
              style={styles.picker}
            >
              <Picker.Item label="Todos" value="" />
              <Picker.Item label="Aberta" value="open" />
              <Picker.Item label="Atribuída" value="assigned" />
              <Picker.Item label="Em Progresso" value="in_progress" />
              <Picker.Item label="Concluída" value="completed" />
              <Picker.Item label="Confirmada" value="confirmed" />
              <Picker.Item label="Cancelada" value="cancelled" />
            </Picker>
          </View>
        </View>

        {user?.userType === UserType.ADMIN && (
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Estabelecimento:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={establishmentFilter}
                onValueChange={setEstablishmentFilter}
                style={styles.picker}
              >
                <Picker.Item label="Todos" value="" />
                {establishments.map(establishment => (
                  <Picker.Item
                    key={establishment.id}
                    label={establishment.name}
                    value={establishment.id}
                  />
                ))}
              </Picker>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ordens de Serviço</Text>
        {user?.userType === UserType.END_USER && (
          <TouchableOpacity style={styles.addButton} onPress={handleCreateOrder}>
            <Icon name="add" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {renderFilters()}

      <FlatList
        data={filteredOrders}
        renderItem={renderOrderItem}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="assignment" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Nenhuma ordem de serviço encontrada</Text>
            {user?.userType === UserType.END_USER && (
              <TouchableOpacity style={styles.createButton} onPress={handleCreateOrder}>
                <Text style={styles.createButtonText}>Criar Nova Ordem</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007bff',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  pickerContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  picker: {
    height: 40,
  },
  listContainer: {
    padding: 16,
  },
  orderItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  badges: {
    flexDirection: 'row',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  orderDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  orderInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  orderNumber: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ServiceOrdersScreen;

