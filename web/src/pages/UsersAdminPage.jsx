import UserForm from '../components/forms/UserForm';
import { apiService } from '../services/api';

const UsersAdminPage = () => {
  const handleCreateUser = async (data) => {
    await apiService.createUser(data);
    // Atualizar lista de usuários
  };

  return <UserForm mode="admin" onSubmit={handleCreateUser} />;
};

export default UsersAdminPage;
