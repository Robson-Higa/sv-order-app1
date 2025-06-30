import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useAuth } from '../contexts/AuthContext';
import { Priority, Establishment, CreateServiceOrderRequest } from '../types';
import { apiService } from '../services/api';

const CreateServiceOrderScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>(Priority.MEDIUM);
  const [establishmentId, setEstablishmentId] = useState('');
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEstablishments();
    
    // Se o usuário tem um estabelecimento associado, pré-selecionar
    if (user?.establishmentId) {
      setEstablishmentId(user.establishmentId);
    }
  }, [user]);

  const loadEstablishments = async () => {
    try {
      const response = await apiService.getEstablishments();
      if (response.establishments) {
        setEstablishments(response.establishments);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os estabelecimentos');
      console.error('Erro ao carregar estabelecimentos:', error);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Erro', 'Por favor, informe o título da ordem');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Erro', 'Por favor, descreva o problema');
      return;
    }

    if (!establishmentId) {
      Alert.alert('Erro', 'Por favor, selecione um estabelecimento');
      return;
    }

    setLoading(true);
    try {
      const orderData: CreateServiceOrderRequest = {
        title: title.trim(),
        description: description.trim(),
        establishmentId,
        priority,
        scheduledDate: scheduledDate?.toISOString(),
      };

      await apiService.createServiceOrder(orderData);
      Alert.alert('Sucesso', 'Ordem de serviço criada com sucesso', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar a ordem de serviço');
      console.error('Erro ao criar ordem:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setScheduledDate(selectedDate);
    }
  };

  const getPriorityColor = (priorityValue: Priority) => {
    switch (priorityValue) {
      case Priority.URGENT: return '#dc3545';
      case Priority.HIGH: return '#fd7e14';
      case Priority.MEDIUM: return '#ffc107';
      case Priority.LOW: return '#28a745';
      default: return '#6c757d';
    }
  };

  const getPriorityText = (priorityValue: Priority) => {
    switch (priorityValue) {
      case Priority.URGENT: return 'Urgente';
      case Priority.HIGH: return 'Alta';
      case Priority.MEDIUM: return 'Média';
      case Priority.LOW: return 'Baixa';
      default: return priorityValue;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Nova Ordem de Serviço</Text>
            <Text style={styles.headerSubtitle}>
              Preencha os dados para solicitar um serviço
            </Text>
          </View>

          <View style={styles.form}>
            {/* Título */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Título *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Ex: Problema na rede elétrica"
                maxLength={100}
              />
              <Text style={styles.charCount}>{title.length}/100</Text>
            </View>

            {/* Descrição */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Descrição do Problema *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Descreva detalhadamente o problema encontrado..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={1000}
              />
              <Text style={styles.charCount}>{description.length}/1000</Text>
            </View>

            {/* Estabelecimento */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Estabelecimento (ESF) *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={establishmentId}
                  onValueChange={setEstablishmentId}
                  style={styles.picker}
                  enabled={!user?.establishmentId} // Desabilitar se já tem estabelecimento
                >
                  <Picker.Item label="Selecione um estabelecimento" value="" />
                  {establishments.map(establishment => (
                    <Picker.Item
                      key={establishment.id}
                      label={establishment.name}
                      value={establishment.id}
                    />
                  ))}
                </Picker>
              </View>
              {user?.establishmentId && (
                <Text style={styles.helpText}>
                  Estabelecimento pré-selecionado baseado no seu perfil
                </Text>
              )}
            </View>

            {/* Prioridade */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Prioridade</Text>
              <View style={styles.priorityContainer}>
                {Object.values(Priority).map((priorityValue) => (
                  <TouchableOpacity
                    key={priorityValue}
                    style={[
                      styles.priorityButton,
                      {
                        backgroundColor: priority === priorityValue 
                          ? getPriorityColor(priorityValue) 
                          : '#f8f9fa'
                      }
                    ]}
                    onPress={() => setPriority(priorityValue)}
                  >
                    <Text
                      style={[
                        styles.priorityButtonText,
                        {
                          color: priority === priorityValue ? '#fff' : '#333'
                        }
                      ]}
                    >
                      {getPriorityText(priorityValue)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Data Agendada */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Data Preferencial (Opcional)</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Icon name="event" size={20} color="#666" />
                <Text style={styles.dateButtonText}>
                  {scheduledDate 
                    ? scheduledDate.toLocaleDateString('pt-BR')
                    : 'Selecionar data'
                  }
                </Text>
                {scheduledDate && (
                  <TouchableOpacity
                    onPress={() => setScheduledDate(undefined)}
                    style={styles.clearDateButton}
                  >
                    <Icon name="clear" size={16} color="#999" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
              <Text style={styles.helpText}>
                Data em que você gostaria que o serviço fosse realizado
              </Text>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={scheduledDate || new Date()}
                mode="date"
                display="default"
                minimumDate={new Date()}
                onChange={handleDateChange}
              />
            )}
          </View>

          {/* Informações importantes */}
          <View style={styles.infoContainer}>
            <View style={styles.infoHeader}>
              <Icon name="info" size={20} color="#007bff" />
              <Text style={styles.infoTitle}>Informações Importantes</Text>
            </View>
            <Text style={styles.infoText}>
              • Sua solicitação será analisada e um técnico será designado
            </Text>
            <Text style={styles.infoText}>
              • Você receberá atualizações sobre o status da ordem
            </Text>
            <Text style={styles.infoText}>
              • Após a conclusão, você poderá avaliar o serviço prestado
            </Text>
          </View>

          {/* Botões */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitButtonText}>
                {loading ? 'Criando...' : 'Criar Ordem'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  picker: {
    height: 50,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  priorityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  priorityButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
    minWidth: '22%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dateButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  clearDateButton: {
    padding: 4,
  },
  infoContainer: {
    backgroundColor: '#e7f3ff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007bff',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#0056b3',
    marginBottom: 4,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#007bff',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateServiceOrderScreen;

