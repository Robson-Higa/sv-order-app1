import React, { useState } from 'react';
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
import Icon from 'react-native-vector-icons/MaterialIcons';

import { useAuth } from '../contexts/AuthContext';
import { UserType } from '../types';
import { apiService } from '../services/api';

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sair',
      'Tem certeza que deseja sair do aplicativo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erro', 'A nova senha e a confirmação não coincidem');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Erro', 'A nova senha deve ter pelo menos 6 caracteres');
      return;
    }

    setChangingPassword(true);
    try {
      await apiService.changePassword(currentPassword, newPassword);
      Alert.alert('Sucesso', 'Senha alterada com sucesso');
      setShowChangePasswordModal(false);
      resetPasswordForm();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível alterar a senha. Verifique sua senha atual.');
    } finally {
      setChangingPassword(false);
    }
  };

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
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

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Carregando perfil...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header do Perfil */}
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Icon name="person" size={60} color="#fff" />
        </View>
        <Text style={styles.userName}>{user.name}</Text>
        <View style={[styles.userTypeBadge, { backgroundColor: getUserTypeColor(user.userType) }]}>
          <Text style={styles.userTypeText}>{getUserTypeText(user.userType)}</Text>
        </View>
      </View>

      {/* Informações do Usuário */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informações Pessoais</Text>
        
        <View style={styles.infoItem}>
          <Icon name="email" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user.email}</Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <Icon name="badge" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Tipo de Usuário</Text>
            <Text style={styles.infoValue}>{getUserTypeText(user.userType)}</Text>
          </View>
        </View>

        {user.establishment && (
          <View style={styles.infoItem}>
            <Icon name="business" size={20} color="#666" />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Estabelecimento</Text>
              <Text style={styles.infoValue}>{user.establishment.name}</Text>
            </View>
          </View>
        )}

        <View style={styles.infoItem}>
          <Icon name="schedule" size={20} color="#666" />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Membro desde</Text>
            <Text style={styles.infoValue}>
              {new Date(user.createdAt).toLocaleDateString('pt-BR')}
            </Text>
          </View>
        </View>

        <View style={styles.infoItem}>
          <Icon name="verified" size={20} color={user.isActive ? '#28a745' : '#dc3545'} />
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Status da Conta</Text>
            <Text style={[styles.infoValue, { color: user.isActive ? '#28a745' : '#dc3545' }]}>
              {user.isActive ? 'Ativa' : 'Inativa'}
            </Text>
          </View>
        </View>
      </View>

      {/* Estatísticas do Usuário */}
      {user.userType === UserType.END_USER && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Minhas Estatísticas</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>-</Text>
              <Text style={styles.statLabel}>Ordens Criadas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>-</Text>
              <Text style={styles.statLabel}>Ordens Concluídas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>-</Text>
              <Text style={styles.statLabel}>Avaliação Média</Text>
            </View>
          </View>
        </View>
      )}

      {user.userType === UserType.TECHNICIAN && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Minhas Estatísticas</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>-</Text>
              <Text style={styles.statLabel}>Ordens Atribuídas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>-</Text>
              <Text style={styles.statLabel}>Ordens Concluídas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>-</Text>
              <Text style={styles.statLabel}>Taxa de Conclusão</Text>
            </View>
          </View>
        </View>
      )}

      {/* Ações */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configurações</Text>
        
        <TouchableOpacity 
          style={styles.actionItem}
          onPress={() => setShowChangePasswordModal(true)}
        >
          <Icon name="lock" size={20} color="#007bff" />
          <Text style={styles.actionText}>Alterar Senha</Text>
          <Icon name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <Icon name="notifications" size={20} color="#007bff" />
          <Text style={styles.actionText}>Notificações</Text>
          <Icon name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <Icon name="help" size={20} color="#007bff" />
          <Text style={styles.actionText}>Ajuda e Suporte</Text>
          <Icon name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionItem}>
          <Icon name="info" size={20} color="#007bff" />
          <Text style={styles.actionText}>Sobre o App</Text>
          <Icon name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* Botão de Logout */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="exit-to-app" size={20} color="#fff" />
          <Text style={styles.logoutButtonText}>Sair do Aplicativo</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de Alteração de Senha */}
      <Modal visible={showChangePasswordModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Alterar Senha</Text>

            <View style={styles.modalForm}>
              <Text style={styles.modalLabel}>Senha Atual *</Text>
              <TextInput
                style={styles.modalInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Digite sua senha atual"
                secureTextEntry
                autoCapitalize="none"
              />

              <Text style={styles.modalLabel}>Nova Senha *</Text>
              <TextInput
                style={styles.modalInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Digite a nova senha (mín. 6 caracteres)"
                secureTextEntry
                autoCapitalize="none"
              />

              <Text style={styles.modalLabel}>Confirmar Nova Senha *</Text>
              <TextInput
                style={styles.modalInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirme a nova senha"
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#6c757d' }]}
                onPress={() => {
                  setShowChangePasswordModal(false);
                  resetPasswordForm();
                }}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: '#007bff' }, changingPassword && styles.modalButtonDisabled]}
                onPress={handleChangePassword}
                disabled={changingPassword}
              >
                <Text style={styles.modalButtonText}>
                  {changingPassword ? 'Alterando...' : 'Alterar'}
                </Text>
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
  profileHeader: {
    backgroundColor: '#007bff',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  userTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  userTypeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoContent: {
    flex: 1,
    marginLeft: 16,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#dc3545',
    paddingVertical: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  logoutButtonText: {
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

export default ProfileScreen;

