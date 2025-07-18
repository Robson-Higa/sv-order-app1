import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { IMaskInput } from 'react-imask';

import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import CardHeader from '../components/ui/card-header';
import CardTitle from '../components/ui/card-title';
import CardContent from '../components/ui/card-content';
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from '../components/ui/table';

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from '../components/ui/select';
//import { Alert, AlertDescription } from '../components/ui/alert';

import { Edit, Trash2 } from 'lucide-react';
import { Eye, EyeOff } from 'lucide-react';
import { UserType, getUserTypeText } from '../types';

const UsersAdminPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  //const [phone, setPhone] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    userType: '',
    establishmentName: '',
  });
  const [establishments, setEstablishments] = useState([]);

  useEffect(() => {
    console.log('Executando useEffect inicial');
    loadUsers();
    loadEstablishments();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const usersResponse = await apiService.getAllUsers();

      console.log('📦 Resposta da API getAllUsers:', usersResponse);

      const usersArray = Array.isArray(usersResponse) ? usersResponse : usersResponse?.users;

      if (!Array.isArray(usersArray)) {
        throw new Error('Resposta da API inválida: não é um array de usuários');
      }

      const sorted = [...usersArray].sort((a, b) =>
        a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
      );

      setUsers(sorted);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      setError('Erro ao carregar usuários.');
    } finally {
      setLoading(false);
    }
  };

  const loadEstablishments = async () => {
    try {
      const res = await apiService.getEstablishments();
      setEstablishments(res.establishments);
    } catch (err) {
      console.error('Erro ao buscar estabelecimentos.');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name || !formData.phone || !formData.userType) {
      setError('Preencha todos os campos obrigatórios.');
      return false;
    }
    if (formData.userType === UserType.END_USER && !formData.establishmentId) {
      setError('Usuário final precisa estar associado a um estabelecimento.');
      return false;
    }
    return true;
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   if (!validateForm()) return;

  //   setLoading(true);
  //   try {
  //     if (editingUser) {
  //       await apiService.updateUser(editingUser.id, formData);
  //     } else {
  //       await apiService.createUser(formData);
  //     }
  //     setIsDialogOpen(false);
  //     setFormData({ name: '', phone: '', userType: '', establishmentId: '' });
  //     setEditingUser(null);
  //     await loadUsers();
  //   } catch (err) {
  //     setError('Erro ao salvar usuário.');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.email ||
      (!editingUser && !formData.password) || // senha só obrigatória se for novo cadastro
      !formData.phone ||
      !formData.userType
    ) {
      alert('Todos os campos obrigatórios devem ser preenchidos.');
      return;
    }

    if (formData.userType === UserType.END_USER && !formData.establishmentName) {
      alert('Usuários finais precisam de um estabelecimento.');
      return;
    }

    const dataToSubmit = {
      ...formData,
      phone: formData.phone,
    };

    // Remove o campo de senha se estiver em edição
    if (editingUser) {
      delete dataToSubmit.password;
    }

    try {
      if (editingUser) {
        await apiService.updateUser(editingUser.id, dataToSubmit);
        alert('Usuário atualizado com sucesso!');
      } else {
        await apiService.createUser(dataToSubmit);
        alert('Usuário cadastrado com sucesso!');
      }

      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        userType: '',
        establishmentName: '',
      });
      await loadUsers();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar usuário.');
    }
  };

  const handleUserSubmit = async (data) => {
    try {
      // Exemplo de dados: { name, email, password, userType, phone, establishmentName }
      await apiService.createUser(data);
      alert('Usuário cadastrado com sucesso!');
      // aqui pode resetar o formulário ou atualizar a lista de usuários etc.
    } catch (error) {
      alert('Erro ao cadastrar usuário: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEdit = (user) => {
    const establishment = establishments.find((e) => e.id === user.establishmentId);

    setEditingUser({ ...user, id: user.uid }); // garante que PATCH use o uid

    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '', // não editável
      phone: user.phone || '',
      userType: user.userType || '',
      establishmentName: establishment?.name || '',
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Deseja excluir este usuário?')) {
      setLoading(true);
      try {
        await apiService.deleteUser(id);
        await loadUsers();
      } catch (err) {
        setError('Erro ao deletar usuário.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleActivation = async (user) => {
    try {
      const updatedStatus = !user.isActive;

      await apiService.updateUser(user.uid || user.id, {
        isActive: updatedStatus,
      });

      alert(`Usuário ${updatedStatus ? 'ativado' : 'desativado'} com sucesso!`);
      await loadUsers();
    } catch (error) {
      console.error('Erro ao ativar/desativar usuário:', error);
      alert('Erro ao atualizar status do usuário.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <div>
        <Label>Nome</Label>
        <Input
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          required
        />
      </div>

      <div>
        <Label>Email</Label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          required
        />
      </div>

      {!editingUser && (
        <div>
          <Label>Senha</Label>
          <Input
            type="password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            required
          />
        </div>
      )}

      <div>
        <Label>Telefone</Label>
        <IMaskInput
          mask="+{55}(00)00000-0000"
          value={formData.phone}
          onAccept={(value) => handleInputChange('phone', value)}
          overwrite
          placeholder="(67) 99999-9999"
          className="border p-2 rounded w-full"
        />
      </div>

      <div>
        <Label>Tipo de Usuário</Label>
        <Select
          value={formData.userType}
          onValueChange={(value) => handleInputChange('userType', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo de usuário" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UserType.ADMIN}>Administrador</SelectItem>
            <SelectItem value={UserType.TECHNICIAN}>Técnico</SelectItem>
            <SelectItem value={UserType.END_USER}>Usuário Final</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.userType === UserType.END_USER && (
        <div>
          <Label>Estabelecimento</Label>
          <Input
            value={formData.establishmentName}
            onChange={(e) => handleInputChange('establishmentName', e.target.value)}
            required
          />
        </div>
      )}

      <Button type="submit">{editingUser ? 'Confirmar Edição' : 'Cadastrar'}</Button>
      {editingUser && (
        <Button
          variant="outline"
          type="button"
          onClick={() => {
            setEditingUser(null);
            setFormData({
              name: '',
              email: '',
              password: '',
              phone: '',
              userType: '',
              establishmentName: '',
            });
          }}
        >
          Cancelar Edição
        </Button>
      )}

      <div className="w-full">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Lista de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Ações</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="w-full">
                {Array.isArray(users) && users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id || user.email || user.name}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{getUserTypeText(user.userType)}</TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => toggleActivation(user)}>
                          {user.isActive ? (
                            <EyeOff className="w-4 h-4 text-yellow-500" />
                          ) : (
                            <Eye className="w-4 h-4 text-green-500" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4}>Nenhum usuário encontrado.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </form>
  );
};

export default UsersAdminPage;
