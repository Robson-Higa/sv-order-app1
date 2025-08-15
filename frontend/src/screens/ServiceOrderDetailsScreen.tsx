import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Picker } from '@react-native-picker/picker';

import { useAuth } from '../contexts/AuthContext';
import { ServiceOrder, ServiceOrderStatus, UserType, User } from '../types';
import { apiService } from '../services/api';

const ServiceOrderDetailsScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { orderId } = route.params as { orderId: string };

  const [serviceOrder, setServiceOrder] = useState<ServiceOrder | null>(null);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  
  // Estados para feedback
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(5);
  
  // Estados para atribuição
  const [selectedTechnician, setSelectedTechnician] = useState('');
  
  // Estados para notas técnicas
  const [technicianNotes, setTechnicianNotes] = useState('');

  useEffect(() => {
    loadServiceOrder();
    if (user?.userType === UserType.ADMIN) {
      loadTechnicians();
    }
  }, [orderId]);

  const loadServiceOrder = async () => {
    try {
      const response = await apiService.getServiceOrderById(orderId);
      if (response.serviceOrder) {
        setServiceOrder(response.serviceOrder);
        setTechnicianNotes(response.serviceOrder.technicianNotes || '');
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os detalhes da ordem');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const loadTechnicians = async () => {
    try {
      const response = await apiService.getTechnicians();
      if (response.technicians) {
        setTechnicians(response.technicians);
      }
    } catch (error) {
      console.error('Erro ao carregar técnicos:', error);
    }
  };

  const handleStatusUpdate = async (newStatus: ServiceOrderStatus) => {
    try {
      await apiService.updateServiceOrder(orderId, { status: newStatus });
      await loadServiceOrder();
      Alert.alert('Sucesso', 'Status atualizado com sucesso');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o status');
    }
  };

  const handleAssignTechnician = async () => {
    if (!selectedTechnician) {
      Alert.alert('Erro', 'Selecione um técnico');
      return;
    }

    try {
      await apiService.assignTechnician(orderId, selectedTechnician);
      await loadServiceOrder();
      setShowAssignModal(false);
      Alert.alert('Sucesso', 'Técnico atribuído com sucesso');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atribuir o técnico');
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) {
      Alert.alert('Erro', 'Por favor, escreva um feedback');
      return;
    }

    try {
      await apiService.submitFeedback(orderId, feedback, rating);
      await loadServiceOrder();
      setShowFeedbackModal(false);
      Alert.alert('Sucesso', 'Feedback enviado com sucesso');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível enviar o feedback');
    }
  };

  const handleUpdateNotes = async () => {
    try {
      await apiService.updateServiceOrder(orderId, { technicianNotes });
      await loadServiceOrder();
      setShowNotesModal(false);
      Alert.alert('Sucesso', 'Notas atualizadas com sucesso');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar as notas');
    }
  };

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancelar Ordem',
      'Tem certeza que deseja cancelar esta ordem de serviço?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.cancelServiceOrder(orderId, 'Cancelado pelo usuário');
              await loadServiceOrder();
              Alert.alert('Sucesso', 'Ordem cancelada com sucesso');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível cancelar a ordem');
            }
          },
        },
      ]
    );
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

  const renderStars = (currentRating: number, onPress?: (rating: number) => void) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => onPress && onPress(star)}
            disabled={!onPress}
          >
            <Icon
              name={star <= currentRating ? 'star' : 'star-border'}
              size={24}
              color="#ffc107"
              style={styles.star}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Carregando detalhes...</Text>
      </View>
    );
  }

  if (!serviceOrder) {
    return (
      <View style={styles.errorContainer}>
        <Text>Ordem de serviço não encontrada</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{serviceOrder.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(serviceOrder.status) }]}>
            <Text style={styles.statusText}>{getStatusText(serviceOrder.status)}</Text>
          </View>
        </View>
        {serviceOrder.orderNumber && (
          <Text style={styles.orderNumber}>#{serviceOrder.orderNumber}</Text>
        )}
      </View>

      {/* Informações básicas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informações</Text>
        
        <View style={styles.infoRow}>
          <Icon name="description" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Descrição</Text>
            <Text style={styles.infoValue}>{serviceOrder.description}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Icon name="business" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Estabelecimento</Text>
            <Text style={styles.infoValue}>
              {serviceOrder.establishment?.name || 'Não informado'}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Icon name="schedule" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Data de Criação</Text>
            <Text style={styles.infoValue}>
              {new Date(serviceOrder.createdAt).toLocaleString('pt-BR')}
            </Text>
          </View>
        </View>

        {serviceOrder.technician && (
          <View style={styles.infoRow}>
            <Icon name="person" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Técnico Responsável</Text>
              <Text style={styles.infoValue}>{serviceOrder.technician.name}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Notas técnicas */}
      {serviceOrder.technicianNotes && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notas do Técnico</Text>
          <Text style={styles.notesText}>{serviceOrder.technicianNotes}</Text>
        </View>
      )}

      {/* Feedback do usuário */}
      {serviceOrder.userFeedback && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Feedback do Usuário</Text>
          <Text style={styles.feedbackText}>{serviceOrder.userFeedback}</Text>
          {serviceOrder.userRating && (
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingLabel}>Avaliação:</Text>
              {renderStars(serviceOrder.userRating)}
            </View>
          )}
        </View>
      )}

      {/* Ações */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Ações</Text>

        {/* Ações do Administrador */}
        {user?.userType === UserType.ADMIN && (
          <>
            {serviceOrder.status === ServiceOrderStatus.OPEN && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowAssignModal(true)}
              >
                <Icon name="assignment-ind" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Atribuir Técnico</Text>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Ações do Técnico */}
        {user?.userType === UserType.TECHNICIAN && serviceOrder.technicianId === user.id && (
          <>
            {serviceOrder.status === ServiceOrderStatus.ASSIGNED && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#007bff' }]}
                onPress={() => handleStatusUpdate(ServiceOrderStatus.IN_PROGRESS)}
              >
                <Icon name="play-arrow" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Iniciar Serviço</Text>
              </TouchableOpacity>
            )}

            {serviceOrder.status === ServiceOrderStatus.IN_PROGRESS && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#28a745' }]}
                onPress={() => handleStatusUpdate(ServiceOrderStatus.COMPLETED)}
              >
                <Icon name="check" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Concluir Serviço</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#6c757d' }]}
              onPress={() => setShowNotesModal(true)}
            >
              <Icon name="note-add" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Adicionar Notas</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Ações do Usuário Final */}
        {user?.userType === UserType.END_USER && serviceOrder.userId === user.id && (
          <>
            {serviceOrder.status === ServiceOrderStatus.COMPLETED && !serviceOrder.userConfirmed && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#6f42c1' }]}
                onPress={() => setShowFeedbackModal(true)}
              >
                <Icon name="feedback" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Avaliar Serviço</Text>
              </TouchableOpacity>
            )}

            {[ServiceOrderStatus.OPEN, ServiceOrderStatus.ASSIGNED].includes(serviceOrder.status) && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#dc3545' }]}
                onPress={handleCancelOrder}
              >
                <Icon name="cancel" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Cancelar Ordem</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>

      {/* Modal de Feedback */}
      <Modal visible={showFeedbackModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Avaliar Serviço</Text>
            
            <Text style={styles.modalLabel}>Avaliação:</Text>
            {renderStars(rating, setRating)}
            
            <Text style={styles.modalLabel}>Feedback:</Text>
            <TextInput
              style={styles.modalTextInput}
              value={feedback}
              onChangeText={setFeedback}
              placeholder="Descreva sua experiência com o serviço..."
              multiline
              numberOfLines={4}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#6c757d' }]}
                onPress={() => setShowFeedbackModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#007bff' }]}
                onPress={handleSubmitFeedback}
              >
                <Text style={styles.modalButtonText}>Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Atribuição */}
      <Modal visible={showAssignModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Atribuir Técnico</Text>
            
            <Text style={styles.modalLabel}>Selecione um técnico:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={selectedTechnician}
                onValueChange={setSelectedTechnician}
                style={styles.picker}
              >
                <Picker.Item label="Selecione um técnico" value="" />
                {technicians.map(technician => (
                  <Picker.Item
                    key={technician.id}
                    label={technician.name}
                    value={technician.id}
                  />
                ))}
              </Picker>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#6c757d' }]}
                onPress={() => setShowAssignModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#007bff' }]}
                onPress={handleAssignTechnician}
              >
                <Text style={styles.modalButtonText}>Atribuir</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Notas */}
      <Modal visible={showNotesModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Notas do Técnico</Text>
            
            <Text style={styles.modalLabel}>Adicione suas observações:</Text>
            <TextInput
              style={styles.modalTextInput}
              value={technicianNotes}
              onChangeText={setTechnicianNotes}
              placeholder="Descreva o serviço realizado, materiais utilizados, etc..."
              multiline
              numberOfLines={6}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#6c757d' }]}
                onPress={() => setShowNotesModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#007bff' }]}
                onPress={handleUpdateNotes}
              >
                <Text style={styles.modalButtonText}>Salvar</Text>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 12,
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
    color: '#666',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  notesText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
  },
  feedbackText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 16,
    color: '#333',
    marginRight: 12,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    marginRight: 4,
  },
  actionsSection: {
    backgroundColor: '#fff',
    marginTop: 12,
    padding: 20,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
  modalTextInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 20,
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

export default ServiceOrderDetailsScreen;

