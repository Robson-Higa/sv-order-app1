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
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { Establishment } from '../types';
import { apiService } from '../services/api';

const EstablishmentsScreen: React.FC = () => {
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEstablishment, setEditingEstablishment] = useState<Establishment | null>(null);

  // Estados para criação/edição
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadEstablishments();
  }, []);

  const loadEstablishments = async () => {
    try {
      const response = await apiService.getEstablishments();
      if (response.establishments) {
        setEstablishments(response.establishments);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os estabelecimentos');
      console.error('Erro ao carregar estabelecimentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEstablishments();
    setRefreshing(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Por favor, informe o nome do estabelecimento');
      return;
    }

    if (!address.trim()) {
      Alert.alert('Erro', 'Por favor, informe o endereço');
      return;
    }

    setSaving(true);
    try {
      const establishmentData = {
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      };

      if (editingEstablishment) {
        await apiService.updateEstablishment(editingEstablishment.id, establishmentData);
        Alert.alert('Sucesso', 'Estabelecimento atualizado com sucesso');
      } else {
        await apiService.createEstablishment(establishmentData);
        Alert.alert('Sucesso', 'Estabelecimento criado com sucesso');
      }

      setShowCreateModal(false);
      resetForm();
      await loadEstablishments();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar o estabelecimento');
      console.error('Erro ao salvar estabelecimento:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setName('');
    setAddress('');
    setPhone('');
    setEmail('');
    setEditingEstablishment(null);
  };

  const handleEdit = (establishment: Establishment) => {
    setEditingEstablishment(establishment);
    setName(establishment.name);
    setAddress(establishment.address);
    setPhone(establishment.phone || '');
    setEmail(establishment.email || '');
    setShowCreateModal(true);
  };

  const handleDelete = (establishment: Establishment) => {
    Alert.alert(
      'Excluir Estabelecimento',
      `Tem certeza que deseja excluir o estabelecimento "${establishment.name}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteEstablishment(establishment.id);
              await loadEstablishments();
              Alert.alert('Sucesso', 'Estabelecimento excluído com sucesso');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir o estabelecimento');
            }
          },
        },
      ]
    );
  };

  const filteredEstablishments = establishments.filter(establishment =>
    establishment.name.toLowerCase().includes(searchText.toLowerCase()) ||
    establishment.address.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderEstablishmentItem = ({ item }: { item: Establishment }) => (
    <View style={styles.establishmentItem}>
      <View style={styles.establishmentHeader}>
        <Text style={styles.establishmentName}>{item.name}</Text>
        <View style={styles.establishmentActions}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#007bff' }]}
            onPress={() => handleEdit(item)}
          >
            <Icon name="edit" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#dc3545' }]}
            onPress={() => handleDelete(item)}
          >
            <Icon name="delete" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.establishmentInfo}>
        <View style={styles.infoRow}>
          <Icon name="location-on" size={16} color="#666" />
          <Text style={styles.infoText}>{item.address}</Text>
        </View>

        {item.phone && (
          <View style={styles.infoRow}>
            <Icon name="phone" size={16} color="#666" />
            <Text style={styles.infoText}>{item.phone}</Text>
          </View>
        )}

        {item.email && (
          <View style={styles.infoRow}>
            <Icon name="email" size={16} color="#666" />
            <Text style={styles.infoText}>{item.email}</Text>
          </View>
        )}
      </View>

      <View style={styles.establishmentFooter}>
        <Text style={styles.dateText}>
          Criado em: {new Date(item.createdAt).toLocaleDateString('pt-BR')}
        </Text>
        {item.isActive ? (
          <View style={styles.statusBadge}>
            <Icon name="check-circle" size={16} color="#28a745" />
            <Text style={[styles.statusText, { color: '#28a745' }]}>Ativo</Text>
          </View>
        ) : (
          <View style={styles.statusBadge}>
            <Icon name="cancel" size={16} color="#dc3545" />
            <Text style={[styles.statusText, { color: '#dc3545' }]}>Inativo</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Estabelecimentos</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setShowCreateModal(true)}
        >
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar estabelecimentos..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <FlatList
        data={filteredEstablishments}
        renderItem={renderEstablishmentItem}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="business" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Nenhum estabelecimento encontrado</Text>
            <TouchableOpacity 
              style={styles.createButton} 
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.createButtonText}>Criar Primeiro Estabelecimento</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Modal de Criação/Edição */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingEstablishment ? 'Editar Estabelecimento' : 'Novo Estabelecimento'}
            </Text>

            <View style={styles.modalForm}>
              <Text style={styles.modalLabel}>Nome *</Text>
              <TextInput
                style={styles.modalInput}
                value={name}
                onChangeText={setName}
                placeholder="Nome do estabelecimento"
              />

              <Text style={styles.modalLabel}>Endereço *</Text>
              <TextInput
                style={[styles.modalInput, styles.textArea]}
                value={address}
                onChangeText={setAddress}
                placeholder="Endereço completo"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <Text style={styles.modalLabel}>Telefone</Text>
              <TextInput
                style={styles.modalInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="(00) 00000-0000"
                keyboardType="phone-pad"
              />

              <Text style={styles.modalLabel}>Email</Text>
              <TextInput
                style={styles.modalInput}
                value={email}
                onChangeText={setEmail}
                placeholder="email@estabelecimento.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#6c757d' }]}
                onPress={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#007bff' }, saving && styles.modalButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.modalButtonText}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
  listContainer: {
    padding: 16,
  },
  establishmentItem: {
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
  establishmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  establishmentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  establishmentActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  establishmentInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  establishmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
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
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalForm: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
  modalButtonDisabled: {
    backgroundColor: '#ccc',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EstablishmentsScreen;

