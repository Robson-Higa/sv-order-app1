import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { UserType, getUserTypeText } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, UserPlus, Building2 } from 'lucide-react';
import '../App.css';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: '',
    establishmentId: ''
  });
  const [establishments, setEstablishments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEstablishments, setLoadingEstablishments] = useState(false);
  const [error, setError] = useState('');
  
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadEstablishments();
  }, []);

  const loadEstablishments = async () => {
    try {
      setLoadingEstablishments(true);
      const response = await apiService.getEstablishments();
      if (response.establishments) {
        setEstablishments(response.establishments);
      }
    } catch (error) {
      console.error('Error loading establishments:', error);
    } finally {
      setLoadingEstablishments(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Nome é obrigatório');
      return false;
    }

    if (!formData.email.trim()) {
      setError('Email é obrigatório');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Email inválido');
      return false;
    }

    if (!formData.password) {
      setError('Senha é obrigatória');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Senhas não coincidem');
      return false;
    }

    if (!formData.userType) {
      setError('Tipo de usuário é obrigatório');
      return false;
    }

    if (formData.userType !== UserType.ADMIN && !formData.establishmentId) {
      setError('Estabelecimento é obrigatório para técnicos e usuários finais');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        userType: formData.userType,
        establishmentId: formData.establishmentId || undefined
      };

      await register(userData);
      navigate('/dashboard');
    } catch (error) {
      setError(error.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Sistema de Gestão
          </h1>
          <p className="text-gray-600">
            Ordens de Serviço
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Criar nova conta
            </CardTitle>
            <CardDescription>
              Preencha os dados para criar sua conta no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Digite seu nome completo"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userType">Tipo de usuário</Label>
                <Select 
                  value={formData.userType} 
                  onValueChange={(value) => handleInputChange('userType', value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserType.ADMIN}>
                      {getUserTypeText(UserType.ADMIN)}
                    </SelectItem>
                    <SelectItem value={UserType.TECHNICIAN}>
                      {getUserTypeText(UserType.TECHNICIAN)}
                    </SelectItem>
                    <SelectItem value={UserType.END_USER}>
                      {getUserTypeText(UserType.END_USER)}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.userType && formData.userType !== UserType.ADMIN && (
                <div className="space-y-2">
                  <Label htmlFor="establishment">Estabelecimento (ESF)</Label>
                  <Select 
                    value={formData.establishmentId} 
                    onValueChange={(value) => handleInputChange('establishmentId', value)}
                    disabled={loading || loadingEstablishments}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estabelecimento" />
                    </SelectTrigger>
                    <SelectContent>
                      {establishments.map(establishment => (
                        <SelectItem key={establishment.id} value={establishment.id}>
                          {establishment.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha (mín. 6 caracteres)"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirme sua senha"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Criar conta
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Já tem uma conta?{' '}
                <Link 
                  to="/login" 
                  className="text-blue-600 hover:text-blue-500 font-medium"
                >
                  Faça login aqui
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Sistema de Gestão de Ordens de Serviço v1.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

