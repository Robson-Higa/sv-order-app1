import UserForm from '../components/forms/UserForm';

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
