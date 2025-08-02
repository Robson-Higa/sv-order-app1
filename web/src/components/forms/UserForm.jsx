import React, { useState, useEffect } from 'react';
import { apiService, fetchEstablishments } from '../../services/api';
import { UserType } from '../../types/index';
import { Button } from '../../components/ui/button';
import { validateUserForm } from '../../utils/validateUserForm';
import toast from 'react-hot-toast';

const UserForm = ({ onUserCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    userType: UserType.END_USER,
    establishmentId: '',
  });
  const [establishments, setEstablishments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadEstablishments() {
      try {
        const data = await fetchEstablishments();
        setEstablishments(data);
      } catch (err) {
        toast.error('Erro ao carregar estabelecimentos.');
        console.error('Erro ao carregar estabelecimentos:', err);
      }
    }
    loadEstablishments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (e) => {
    let input = e.target.value.replace(/\D/g, '');
    if (input.length > 11) input = input.slice(0, 11);

    let formatted = input;
    if (input.length > 2 && input.length <= 7) {
      formatted = `(${input.slice(0, 2)}) ${input.slice(2)}`;
    } else if (input.length > 7) {
      formatted = `(${input.slice(0, 2)}) ${input.slice(2, 7)}-${input.slice(7)}`;
    }

    setFormData((prev) => ({ ...prev, phone: formatted }));
  };

  const formatPhoneNumber = (phone) => {
    const digits = phone.replace(/\D/g, '');
    return `+55${digits}`;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      userType: UserType.END_USER,
      establishmentId: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Validação do formulário
    if (!validateUserForm(formData, (errMsg) => toast.error(errMsg))) return;

    setLoading(true);

    try {
      const formattedPhone = formatPhoneNumber(formData.phone);

      const userData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formattedPhone,
        password: formData.password,
        userType: formData.userType,
        establishmentId: formData.establishmentId || undefined,
      };

      await apiService.createUser(userData);

      toast.success('Usuário cadastrado com sucesso!');

      if (typeof onUserCreated === 'function') {
        await onUserCreated(userData);
      }

      resetForm();
    } catch (error) {
      console.error(error);

      // ✅ Mostra mensagem do servidor ou genérica
      const message =
        error.response?.data?.error || error.message || 'Erro ao criar conta. Tente novamente.';

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        name="name"
        placeholder="Nome"
        value={formData.name}
        onChange={handleChange}
        className="border p-2 w-full"
      />
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
        className="border p-2 w-full"
      />
      <input
        type="password"
        name="password"
        placeholder="Senha"
        value={formData.password}
        onChange={handleChange}
        className="border p-2 w-full"
      />
      <input
        type="tel"
        name="phone"
        placeholder="(99) 99999-9999"
        value={formData.phone}
        onChange={handlePhoneChange}
        className="border p-2 w-full"
      />

      <select
        name="userType"
        value={formData.userType}
        onChange={handleChange}
        className="border p-2 w-full"
      >
        <option value={UserType.ADMIN}>Administrador</option>
        <option value={UserType.TECHNICIAN}>Técnico</option>
        <option value={UserType.END_USER}>Usuário Final</option>
      </select>

      {formData.userType === UserType.END_USER && (
        <select
          name="establishmentId"
          value={formData.establishmentId}
          onChange={handleChange}
          className="border p-2 w-full"
        >
          <option value="">Selecione um Estabelecimento</option>
          {establishments.map((est) => (
            <option key={est.id} value={est.id}>
              {est.name}
            </option>
          ))}
        </select>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? 'Salvando...' : 'Cadastrar Usuário'}
      </Button>
    </form>
  );
};

export default UserForm;
