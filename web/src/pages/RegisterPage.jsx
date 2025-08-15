import UserForm from '../components/forms/UserForm';
import { useAuth } from '../contexts/AuthContext'; // ou o caminho correto para seu AuthContext
import { useNavigate } from 'react-router-dom';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (data) => {
    await register(data);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <UserForm mode="register" onSubmit={handleRegister} />
    </div>
  );
};

export default RegisterPage;
