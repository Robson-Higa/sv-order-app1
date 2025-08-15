import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import axios from 'axios';
import InputMask from 'react-input-mask';

const POSITIONS = ['Operador', 'Técnico', 'Supervisor', 'Analista', 'Assistente'];

const PublicRegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    establishmentId: '',
    position: '',
    phone: '',
    phoneDisplay: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [establishments, setEstablishments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEstablishments, setLoadingEstablishments] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Carregar estabelecimentos via API (backend)
  useEffect(() => {
    const fetchEstablishments = async () => {
      try {
        const res = await axios.get('/api/public/establishments');
        setEstablishments(res.data || []);
      } catch (err) {
        console.error('Erro ao carregar estabelecimentos:', err);
        setError('Não foi possível carregar a lista de estabelecimentos');
      } finally {
        setLoadingEstablishments(false);
      }
    };
    fetchEstablishments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    let formattedValue = '';
    if (rawValue.length > 0) {
      formattedValue = `(${rawValue.substring(0, 2)}`;
      if (rawValue.length > 2) {
        formattedValue += `) ${rawValue.substring(2, 7)}`;
        if (rawValue.length > 7) {
          formattedValue += `-${rawValue.substring(7, 11)}`;
        }
      }
    }
    setFormData((prev) => ({
      ...prev,
      phone: rawValue ? `+55${rawValue}` : '',
      phoneDisplay: formattedValue,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (!formData.establishmentId) {
      setError('Selecione um estabelecimento');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        establishmentId: formData.establishmentId,
        position: formData.position,
      };

      await axios.post('/api/public-register', payload);

      navigate('/login', { state: { registered: true } });
    } catch (err) {
      console.error('Erro no cadastro:', err);
      setError(err.response?.data?.message || 'Ocorreu um erro durante o cadastro');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    // Redireciona para backend -> Google OAuth -> callback -> frontend
    window.location.href = '/api/public/google-login';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md card-custom p-8">
        <h2 className="text-2xl font-medium text-foreground mb-6 text-center">Criar nova conta</h2>

        {error && <div className="variant-destructive p-3 rounded-md mb-4 text-sm">{error}</div>}

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Nome */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Nome completo*</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-custom"
              required
            />
          </div>

          {/* Estabelecimento */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Estabelecimento*</label>
            {loadingEstablishments ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                Carregando estabelecimentos...
              </div>
            ) : (
              <select
                name="establishmentId"
                value={formData.establishmentId}
                onChange={handleChange}
                className="select-trigger-custom"
                required
              >
                <option value="">Selecione seu estabelecimento</option>
                {establishments.map((est) => (
                  <option key={est.id} value={est.id}>
                    {est.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Cargo */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Função/Cargo*</label>
            <select
              name="position"
              value={formData.position}
              onChange={handleChange}
              className="select-trigger-custom"
              required
            >
              <option value="">Selecione sua função</option>
              {POSITIONS.map((p, idx) => (
                <option key={idx} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Telefone*</label>
            <InputMask
              mask="(99) 99999-9999"
              value={formData.phoneDisplay || ''}
              onChange={handlePhoneChange}
              placeholder="(00) 00000-0000"
            >
              {(inputProps) => (
                <input {...inputProps} type="tel" className="input-custom" required />
              )}
            </InputMask>
            <p className="text-xs text-muted-foreground">Formato: (DDD) 99999-9999</p>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email*</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input-custom"
              required
            />
          </div>

          {/* Senha */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Senha* (mínimo 6 caracteres)
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input-custom"
              required
            />
          </div>

          {/* Confirmação de senha */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Confirme sua senha*</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="input-custom"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || loadingEstablishments}
            className="btn-primary w-full mt-6"
          >
            {loading ? 'Cadastrando...' : 'Finalizar Cadastro'}
          </button>
        </form>

        <button onClick={handleGoogleRegister} className="btn-google w-full mt-4">
          Cadastrar com Google
        </button>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          Já tem uma conta?{' '}
          <button
            onClick={() => navigate('/login')}
            className="font-medium text-primary hover:underline"
          >
            Faça login
          </button>
        </div>
      </div>
    </div>
  );
};

export default PublicRegisterPage;
