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
import { Picker } from '@react-native-picker/picker';

import { useAuth } from '../contexts/AuthContext';
import { User, UserType, Establishment, RegisterRequest } from '../types';
import { apiService } from '../services/api';

const UsersScreen: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Estados para criação de usuário
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserType, setNewUserType] = useState<UserType>(UserType.END_USER);
  const [newUserEstablishment, setNewUserEstablishment] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    loadData();
  }, [userTypeFilter]);

  const loadData = async () => {
    try {
      const [usersResponse, establishmentsResponse] = await Promise.all([
        apiService.getUsers(),
        apiService.getEstablishments(),
      ]);

      if (usersResponse.users) {
        let filteredUsers = usersResponse.users;
        if (userTypeFilter) {
          filteredUsers = filteredUsers.filter(user => user.userType === userTypeFilter);
        }
        setUsers(filteredUsers);
      }

      if (establishmentsResponse.establishments) {
        setEstablishments(establishmentsResponse.establishments);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os usuários');
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (newUserType !== UserType.ADMIN && !newUserEstablishment) {
      Alert.alert('Erro', 'Por favor, selecione um estabelecimento');
      return;
    }

    setCreatingUser(true);
    try {
      const userData: RegisterRequest = {
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        password: newUserPassword,
        userType: newUserType,
        establishmentId: newUserType === UserType.ADMIN ? undefined : newUserEstablishment,
      };

      if (newUserType === UserType.ADMIN) {
        await apiService.registerAdmin(userData);
      } else if (newUserType === UserType.TECHNICIAN) {
        await apiService.registerTechnician(userData);
      } else {
        await apiService.register(userData);
      }

      Alert.alert('Sucesso', 'Usuário criado com sucesso');
      setShowCreateModal(false);
      resetCreateForm();
      await loadData();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível criar o usuário');
      console.error('Erro ao criar usuário:', error);
    } finally {
      setCreatingUser(false);
    }
  };

  const resetCreateForm = () => {
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserType(UserType.END_USER);
    setNewUserEstablishment('');
  };

  const handleToggleUserStatus = (user: User) => {
    const action = user.isActive ? 'desativar' : 'ativar';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Usuário`,
      `Tem certeza que deseja ${action} o usuário ${user.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            try {
              if (user.isActive) {
                await apiService.deactivateUser(user.id);
              } else {
                await apiService.activateUser(user.id);
              }
              await loadData();
              Alert.alert('Sucesso', `Usuário ${action}do com sucesso`);
            } catch (error) {
              Alert.alert('Erro', `Não foi possível ${action} o usuário`);
            }
          },
        },
      ]
    );
  };

  const handleDeleteUser = (user: User) => {
    Alert.alert(
      'Excluir Usuário',
      `Tem certeza que deseja excluir permanentemente o usuário ${user.name}? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteUser(user.id);
              await loadData();
              Alert.alert('Sucesso', 'Usuário excluído com sucesso');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir o usuário');
            }
          },
        },
      ]
    );
  };

  const getUserTypeText = (userType: UserType) => {
    switch (userType) {
      case UserType.ADMIN: return 'Administrador';
      case UserType.TECHNICIAN: return 'Técnico';
      case UserType.END_USER: return 'Usuário Final';
      default: return userType;
    }
  };

  const getUserTypeColor = (userType: UserType) => {
    switch (userType) {
      case UserType.ADMIN: return '#dc3545';
      case UserType.TECHNICIAN: return '#007bff';
      case UserType.END_USER: return '#28a745';
      default: return '#6c757d';
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchText.toLowerCase()) ||
    user.email.toLowerCase().includes(searchText.toLowerCase())
  );

  const renderUserItem = ({ item }: { item: User }) => {
    const establishment = establishments.find(est => est.id === item.establishmentId);
    
    return (
      <View style={[styles.userItem, !item.isActive && styles.userItemInactive]}>
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.userEmail}>{item.email}</Text>
          </View>
          <View style={[styles.userTypeBadge, { backgroundColor: getUserTypeColor(item.userType) }]}>
            <Text style={styles.userTypeText}>{getUserTypeText(item.userType)}</Text>
          </View>
        </View>

        {establishment && (
          <View style={styles.establishmentInfo}>
            <Icon name="business" size={16} color="#666" />
            <Text style={styles.establishmentText}>{establishment.name}</Text>
          </View>
        )}

        <View style={styles.userFooter}>
          <View style={styles.userStatus}>
            <Icon 
              name={item.isActive ? 'check-circle' : 'cancel'} 
              size={16} 
              color={item.isActive ? '#28a745' : '#dc3545'} 
            />
            <Text style={[styles.statusText, { color: item.isActive ? '#28a745' : '#dc3545' }]}>
              {item.isActive ? 'Ativo' : 'Inativo'}
            </Text>
          </View>

          <View style={styles.userActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: item.isActive ? '#ffc107' : '#28a745' }]}
              onPress={() => handleToggleUserStatus(item)}
            >
              <Icon 
                name={item.isActive ? 'pause' : 'play-arrow'} 
                size={16} 
                color="#fff" 
              />
            </TouchableOpacity>

            {item.id !== currentUser?.id && (
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#dc3545' }]}
                onPress={() => handleDeleteUser(item)}
              >
                <Icon name="delete" size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.userDates}>
          <Text style={styles.dateText}>
            Criado em: {new Date(item.createdAt).toLocaleDateString('pt-BR')}
          </Text>
        </View>
      </View>
    );
  };

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar usuários..."
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Tipo de usuário:</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={userTypeFilter}
            onValueChange={setUserTypeFilter}
            style={styles.picker}
          >
            <Picker.Item label="Todos" value="" />
            <Picker.Item label="Administradores" value={UserType.ADMIN} />
            <Picker.Item label="Técnicos" value={UserType.TECHNICIAN} />
            <Picker.Item label="Usuários Finais" value={UserType.END_USER} />
          </Picker>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Usuários</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setShowCreateModal(true)}
        >
          <Icon name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {renderFilters()}

      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="people" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Nenhum usuário encontrado</Text>
          </View>
        }
      />

      {/* Modal de Criação de Usuário */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Novo Usuário</Text>

            <View style={styles.modalForm}>
              <Text style={styles.modalLabel}>Nome *</Text>
              <TextInput
                style={styles.modalInput}
                value={newUserName}
                onChangeText={setNewUserName}
                placeholder="Nome completo"
              />

              <Text style={styles.modalLabel}>Email *</Text>
              <TextInput
                style={styles.modalInput}
                value={newUserEmail}
                onChangeText={setNewUserEmail}
                placeholder="email@exemplo.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.modalLabel}>Senha *</Text>
              <TextInput
                style={styles.modalInput}
                value={newUserPassword}
                onChangeText={setNewUserPassword}
                placeholder="Mínimo 6 caracteres"
                secureTextEntry
              />

              <Text style={styles.modalLabel}>Tipo de Usuário *</Text>
              <View style={styles.modalPickerContainer}>
                <Picker
                  selectedValue={newUserType}
                  onValueChange={setNewUserType}
                  style={styles.modalPicker}
                >
                  <Picker.Item label="Usuário Final" value={UserType.END_USER} />
                  <Picker.Item label="Técnico" value={UserType.TECHNICIAN} />
                  <Picker.Item label="Administrador" value={UserType.ADMIN} />
                </Picker>
              </View>

              {newUserType !== UserType.ADMIN && (
                <>
                  <Text style={styles.modalLabel}>Estabelecimento *</Text>
                  <View style={styles.modalPickerContainer}>
                    <Picker
                      selectedValue={newUserEstablishment}
                      onValueChange={setNewUserEstablishment}
                      style={styles.modalPicker}
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
                </>
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#6c757d' }]}
                onPress={() => {
                  setShowCreateModal(false);
                  resetCreateForm();
                }}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#007bff' }, creatingUser && styles.modalButtonDisabled]}
                onPress={handleCreateUser}
                disabled={creatingUser}
              >
                <Text style={styles.modalButtonText}>
                  {creatingUser ? 'Criando...' : 'Criar'}
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
    alignItems: 'center',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 12,
  },
  pickerContainer: {
    flex: 1,
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
  userItem: {
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
  userItemInactive: {
    opacity: 0.7,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
    marginRight: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  userTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  userTypeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  establishmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  establishmentText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  userFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  userActions: {
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
  userDates: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
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
  modalPickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 16,
  },
  modalPicker: {
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
  modalButtonDisabled: {
    backgroundColor: '#ccc',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default UsersScreen;

