import React, { useState } from 'react';
import InputMask from 'react-input-mask';
import { apiService } from '../services/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';

const userTypes = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'TECHNICIAN', label: 'Técnico' },
  { value: 'END_USER', label: 'Usuário Final' },
];

export default function CadastroUsuario() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    userType: '',
    phone: '',
    establishmentName: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function validateEmail(email) {
    // regex simples para email
    return /\S+@\S+\.\S+/.test(email);
  }

  function validatePhone(phone) {
    // Verifica se tem 10 ou 11 dígitos numéricos (considerando máscara)
    const digits = phone.replace(/\D/g, '');
    return digits.length === 10 || digits.length === 11;
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Nome é obrigatório');
      return false;
    }
    if (!validateEmail(formData.email)) {
      setError('Email inválido');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres');
      return false;
    }
    if (!formData.userType) {
      setError('Tipo de usuário é obrigatório');
      return false;
    }
    if (!validatePhone(formData.phone)) {
      setError('Telefone inválido');
      return false;
    }
    if (formData.userType === 'END_USER' && !formData.establishmentName.trim()) {
      setError('Estabelecimento é obrigatório para Usuário Final');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      await apiService.createUser(formData);
      setSuccess('Usuário cadastrado com sucesso!');
      setFormData({
        name: '',
        email: '',
        password: '',
        userType: '',
        phone: '',
        establishmentName: '',
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao cadastrar usuário');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert variant="success">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div>
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          required
        />
      </div>

      <div>
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
          required
          minLength={6}
        />
      </div>

      <div>
        <Label htmlFor="userType">Tipo de Usuário</Label>
        <Select
          value={formData.userType}
          onValueChange={(val) => handleChange('userType', val)}
          required
        >
          <SelectTrigger id="userType" className="w-full">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            {userTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="phone">Telefone</Label>
        <InputMask
          mask="(99) 99999-9999"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
        >
          {(inputProps) => <Input {...inputProps} id="phone" required />}
        </InputMask>
      </div>

      {formData.userType === 'END_USER' && (
        <div>
          <Label htmlFor="establishmentName">Estabelecimento</Label>
          <Input
            id="establishmentName"
            value={formData.establishmentName}
            onChange={(e) => handleChange('establishmentName', e.target.value)}
            required
          />
        </div>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? 'Cadastrando...' : 'Cadastrar Usuário'}
      </Button>
    </form>
  );
}
