import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useAuth } from '../contexts/AuthContext';
import { UserType, ServiceOrder, Establishment, User } from '../types';
import { apiService } from '../services/api';
import { reportService } from '../services/reportService';
import {
  OrdersLineChart,
  OrdersBarChart,
  StatusPieChart,
  TechnicianPerformanceChart,
  MonthlyTrendsChart,
} from '../components/Charts';

const ReportsScreen: React.FC = () => {
  const { user } = useAuth();
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  
  // Filtros
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1));
  const [endDate, setEndDate] = useState(new Date());
  const [selectedEstablishment, setSelectedEstablishment] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // Modais
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [startDate, endDate, selectedEstablishment, selectedTechnician, selectedStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const filters = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        establishmentId: selectedEstablishment || undefined,
        technicianId: selectedTechnician || undefined,
        status: selectedStatus || undefined,
      };

      const [ordersResponse, establishmentsResponse, techniciansResponse] = await Promise.all([
        apiService.getReports(filters),
        apiService.getEstablishments(),
        apiService.getTechnicians(),
      ]);

      if (ordersResponse.serviceOrders) {
        setServiceOrders(ordersResponse.serviceOrders);
      }

      if (establishmentsResponse.establishments) {
        setEstablishments(establishmentsResponse.establishments);
      }

      if (techniciansResponse.technicians) {
        setTechnicians(techniciansResponse.technicians);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os dados dos relatórios');
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      setGeneratingReport(true);
      
      const reportData = {
        serviceOrders,
        establishments,
        technicians,
        dateRange: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        filters: {
          establishmentId: selectedEstablishment || undefined,
          technicianId: selectedTechnician || undefined,
          status: selectedStatus || undefined,
        },
      };

      await reportService.generateAndShareReport(reportData);
      Alert.alert('Sucesso', 'Relatório gerado e compartilhado com sucesso');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível gerar o relatório');
      console.error('Erro ao gerar relatório:', error);
    } finally {
      setGeneratingReport(false);
    }
  };

  const getStatusChartData = () => {
    const statusCounts: Record<string, number> = {};
    serviceOrders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });

    const statusColors: Record<string, string> = {
      'open': '#ffc107',
      'assigned': '#17a2b8',
      'in_progress': '#007bff',
      'completed': '#28a745',
      'confirmed': '#6f42c1',
      'cancelled': '#dc3545',
    };

    const statusLabels: Record<string, string> = {
      'open': 'Aberta',
      'assigned': 'Atribuída',
      'in_progress': 'Em Progresso',
      'completed': 'Concluída',
      'confirmed': 'Confirmada',
      'cancelled': 'Cancelada',
    };

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: statusLabels[status] || status,
      population: count,
      color: statusColors[status] || '#6c757d',
      legendFontColor: '#333',
      legendFontSize: 12,
    }));
  };

  const getMonthlyTrendsData = () => {
    const monthlyData: Record<string, { created: number; completed: number; cancelled: number }> = {};
    
    serviceOrders.forEach(order => {
      const month = new Date(order.createdAt).toLocaleDateString('pt-BR', { 
        year: 'numeric', 
        month: 'short' 
      });
      
      if (!monthlyData[month]) {
        monthlyData[month] = { created: 0, completed: 0, cancelled: 0 };
      }
      
      monthlyData[month].created++;
      
      if (order.status === 'completed' || order.status === 'confirmed') {
        monthlyData[month].completed++;
      }
      
      if (order.status === 'cancelled') {
        monthlyData[month].cancelled++;
      }
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([month, data]) => ({
        month: month.replace('.', ''),
        ...data,
      }));
  };

  const getTechnicianPerformanceData = () => {
    const technicianData: Record<string, {
      name: string;
      ordersCompleted: number;
      totalRating: number;
      ratedOrders: number;
      totalOrders: number;
    }> = {};

    serviceOrders.forEach(order => {
      if (order.technician) {
        const techId = order.technician.id;
        
        if (!technicianData[techId]) {
          technicianData[techId] = {
            name: order.technician.name,
            ordersCompleted: 0,
            totalRating: 0,
            ratedOrders: 0,
            totalOrders: 0,
          };
        }
        
        technicianData[techId].totalOrders++;
        
        if (order.status === 'completed' || order.status === 'confirmed') {
          technicianData[techId].ordersCompleted++;
        }
        
        if (order.userRating) {
          technicianData[techId].totalRating += order.userRating;
          technicianData[techId].ratedOrders++;
        }
      }
    });

    return Object.values(technicianData).map(tech => ({
      name: tech.name,
      ordersCompleted: tech.ordersCompleted,
      averageRating: tech.ratedOrders > 0 ? tech.totalRating / tech.ratedOrders : 0,
      completionRate: tech.totalOrders > 0 ? tech.ordersCompleted / tech.totalOrders : 0,
    }));
  };

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowStartDatePicker(true)}
        >
          <Icon name="event" size={16} color="#007bff" />
          <Text style={styles.dateButtonText}>
            {startDate.toLocaleDateString('pt-BR')}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.dateRangeText}>até</Text>
        
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowEndDatePicker(true)}
        >
          <Icon name="event" size={16} color="#007bff" />
          <Text style={styles.dateButtonText}>
            {endDate.toLocaleDateString('pt-BR')}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.filtersButton}
        onPress={() => setShowFiltersModal(true)}
      >
        <Icon name="filter-list" size={20} color="#007bff" />
        <Text style={styles.filtersButtonText}>Filtros Avançados</Text>
      </TouchableOpacity>
    </View>
  );

  const renderStats = () => {
    const totalOrders = serviceOrders.length;
    const completedOrders = serviceOrders.filter(o => o.status === 'completed' || o.status === 'confirmed').length;
    const cancelledOrders = serviceOrders.filter(o => o.status === 'cancelled').length;
    const averageRating = serviceOrders.reduce((sum, order) => sum + (order.userRating || 0), 0) / 
                         serviceOrders.filter(o => o.userRating).length || 0;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalOrders}</Text>
          <Text style={styles.statLabel}>Total de Ordens</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{completedOrders}</Text>
          <Text style={styles.statLabel}>Concluídas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{cancelledOrders}</Text>
          <Text style={styles.statLabel}>Canceladas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{averageRating.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Avaliação Média</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Carregando relatórios...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Relatórios e Análises</Text>
        <TouchableOpacity
          style={[styles.generateButton, generatingReport && styles.generateButtonDisabled]}
          onPress={handleGenerateReport}
          disabled={generatingReport}
        >
          <Icon name="picture-as-pdf" size={20} color="#fff" />
          <Text style={styles.generateButtonText}>
            {generatingReport ? 'Gerando...' : 'Gerar PDF'}
          </Text>
        </TouchableOpacity>
      </View>

      {renderFilters()}
      {renderStats()}

      {serviceOrders.length > 0 ? (
        <>
          <StatusPieChart
            data={getStatusChartData()}
            title="Distribuição por Status"
          />

          <MonthlyTrendsChart
            data={getMonthlyTrendsData()}
          />

          {user?.userType === UserType.ADMIN && (
            <TechnicianPerformanceChart
              data={getTechnicianPerformanceData()}
            />
          )}
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Icon name="assessment" size={64} color="#ccc" />
          <Text style={styles.emptyText}>
            Nenhum dado encontrado para o período selecionado
          </Text>
        </View>
      )}

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false);
            if (selectedDate) {
              setStartDate(selectedDate);
            }
          }}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false);
            if (selectedDate) {
              setEndDate(selectedDate);
            }
          }}
        />
      )}

      {/* Filters Modal */}
      <Modal visible={showFiltersModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Filtros Avançados</Text>

            <Text style={styles.modalLabel}>Estabelecimento:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedEstablishment}
                onValueChange={setSelectedEstablishment}
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

            <Text style={styles.modalLabel}>Técnico:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedTechnician}
                onValueChange={setSelectedTechnician}
                style={styles.picker}
              >
                <Picker.Item label="Todos" value="" />
                {technicians.map(technician => (
                  <Picker.Item
                    key={technician.id}
                    label={technician.name}
                    value={technician.id}
                  />
                ))}
              </Picker>
            </View>

            <Text style={styles.modalLabel}>Status:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedStatus}
                onValueChange={setSelectedStatus}
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

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#6c757d' }]}
                onPress={() => setShowFiltersModal(false)}
              >
                <Text style={styles.modalButtonText}>Fechar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#dc3545' }]}
                onPress={() => {
                  setSelectedEstablishment('');
                  setSelectedTechnician('');
                  setSelectedStatus('');
                  setShowFiltersModal(false);
                }}
              >
                <Text style={styles.modalButtonText}>Limpar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  generateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  filtersContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flex: 1,
  },
  dateButtonText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  dateRangeText: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 12,
  },
  filtersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filtersButtonText: {
    fontSize: 14,
    color: '#007bff',
    marginLeft: 8,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
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
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
  },
  picker: {
    height: 50,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ReportsScreen;

