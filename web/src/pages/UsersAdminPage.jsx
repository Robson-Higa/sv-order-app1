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
import { Alert, AlertDescription } from '../components/ui/alert';

import { Edit, Trash2, Loader2, Plus } from 'lucide-react';
import { UserType, getUserTypeText } from '../types';

const UsersAdminPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [phone, setPhone] = useState('');
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
    loadUsers();
    loadEstablishments();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await apiService.getAllUsers();
      setUsers(response.users);
    } catch (err) {
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
      !formData.password ||
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

    try {
      await apiService.createUser(formData);
      alert('Usuário cadastrado com sucesso!');
      setFormData({
        name: '',
        email: '',
        password: '',
        phone: '',
        userType: '',
        establishmentName: '',
      });
    } catch (err) {
      console.error(err);
      alert('Erro ao cadastrar usuário.');
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
    setEditingUser(user);
    setFormData({
      name: user.name,
      phone: user.phone,
      userType: user.userType,
      establishmentId: user.establishmentId || '',
    });
    setIsDialogOpen(true);
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

  // return (
  //   <div className="space-y-6">
  //     <div className="flex justify-between items-center">
  //       <h1 className="text-2xl font-bold text-gray-900">Gerenciar Usuários</h1>
  //       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
  //         <DialogTrigger asChild>
  //           <Button
  //             onClick={() => {
  //               setEditingUser(null);
  //               setFormData({ name: '', phone: '', userType: '', establishmentId: '' });
  //               setError('');
  //             }}
  //           >
  //             <Plus className="w-4 h-4 mr-2" /> Novo Usuário
  //           </Button>
  //         </DialogTrigger>
  //         <DialogContent>
  //           <DialogHeader>
  //             <DialogTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
  //           </DialogHeader>
  //           <form onSubmit={handleSubmit} className="space-y-4">
  //             {error && (
  //               <Alert variant="destructive">
  //                 <AlertDescription>{error}</AlertDescription>
  //               </Alert>
  //             )}
  //             <div>
  //               <Label>Nome</Label>
  //               <Input
  //                 value={formData.name}
  //                 onChange={(e) => handleInputChange('name', e.target.value)}
  //                 required
  //               />
  //             </div>
  //             <div>
  //               <Label>Telefone</Label>
  //               <Input
  //                 value={formData.phone}
  //                 onChange={(e) => handleInputChange('phone', e.target.value)}
  //                 required
  //               />
  //             </div>
  //             <div>
  //               <Label>Tipo de Usuário</Label>
  //               <Select
  //                 value={formData.userType}
  //                 onValueChange={(value) => handleInputChange('userType', value)}
  //               >
  //                 <SelectTrigger>
  //                   <SelectValue placeholder="Selecione" />
  //                 </SelectTrigger>
  //                 <SelectContent>
  //                   <SelectItem value={UserType.ADMIN}>Administrador</SelectItem>
  //                   <SelectItem value={UserType.TECHNICIAN}>Técnico</SelectItem>
  //                   <SelectItem value={UserType.END_USER}>Usuário Final</SelectItem>
  //                 </SelectContent>
  //               </Select>
  //             </div>
  //             {formData.userType === UserType.END_USER && (
  //               <div>
  //                 <Label>Estabelecimento</Label>
  //                 <Select
  //                   value={formData.establishmentId}
  //                   onValueChange={(value) => handleInputChange('establishmentId', value)}
  //                 >
  //                   <SelectTrigger>
  //                     <SelectValue placeholder="Selecione" />
  //                   </SelectTrigger>
  //                   <SelectContent>
  //                     {establishments.map((est) => (
  //                       <SelectItem key={est.id} value={est.id}>
  //                         {est.name}
  //                       </SelectItem>
  //                     ))}
  //                   </SelectContent>
  //                 </Select>
  //               </div>
  //             )}
  //             <DialogFooter>
  //               <Button type="submit" disabled={loading}>
  //                 {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
  //                 Salvar
  //               </Button>
  //             </DialogFooter>
  //           </form>
  //         </DialogContent>
  //       </Dialog>
  //     </div>

  //     <Card>
  //       <CardHeader>
  //         <CardTitle>Lista de Usuários</CardTitle>
  //       </CardHeader>
  //       <CardContent>
  //         <Table>
  //           <TableHeader>
  //             <TableRow>
  //               <TableHead>Nome</TableHead>
  //               <TableHead>Tipo</TableHead>
  //               <TableHead>Telefone</TableHead>
  //               <TableHead>Ações</TableHead>
  //             </TableRow>
  //           </TableHeader>
  //           <TableBody>
  //             {users.map((user) => (
  //               <TableRow key={user.id}>
  //                 <TableCell>{user.name}</TableCell>
  //                 <TableCell>{getUserTypeText(user.userType)}</TableCell>
  //                 <TableCell>{user.phone}</TableCell>
  //                 <TableCell className="flex gap-2">
  //                   <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>
  //                     <Edit className="w-4 h-4" />
  //                   </Button>
  //                   <Button
  //                     variant="outline"
  //                     size="sm"
  //                     className="text-red-600"
  //                     onClick={() => handleDelete(user.id)}
  //                   >
  //                     <Trash2 className="w-4 h-4" />
  //                   </Button>
  //                 </TableCell>
  //               </TableRow>
  //             ))}
  //           </TableBody>
  //         </Table>
  //       </CardContent>
  //     </Card>
  //   </div>
  // );

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
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

      <div>
        <Label>Senha</Label>
        <Input
          type="password"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          required
        />
      </div>

      <div>
        <Label>Telefone</Label>

        <IMaskInput
          mask="(00) 00000-0000"
          value={phone}
          onAccept={(value) => setPhone(value)}
          unmask={true} // opcional, retorna valor "limpo"
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

      <Button type="submit">Cadastrar</Button>
    </form>
  );
};

export default UsersAdminPage;
