import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../components/ui/dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Plus, Edit, Trash2, Loader2, Search } from 'lucide-react';
import '../App.css';

const EstablishmentsPage = () => {
  const [establishments, setEstablishments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEstablishment, setEditingEstablishment] = useState(null);
  const [formData, setFormData] = useState({ name: '' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadEstablishments();
  }, []);

  const loadEstablishments = async () => {
    try {
      setLoading(true);
      const response = await apiService.getEstablishments();
      if (response?.establishments) {
        setEstablishments(response.establishments);
      }
    } catch (err) {
      console.error('Error loading establishments:', err);
      setError(err.message || 'Erro ao carregar estabelecimentos.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Nome do estabelecimento é obrigatório');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      const data = { name: formData.name.trim() };

      if (editingEstablishment) {
        await apiService.updateEstablishment(editingEstablishment.id, data);
      } else {
        await apiService.createEstablishment(data);
      }

      await loadEstablishments();
      setIsDialogOpen(false);
      setEditingEstablishment(null);
      setFormData({ name: '' });
    } catch (err) {
      console.error('Error saving establishment:', err);
      setError(err.message || 'Erro ao salvar estabelecimento.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (est) => {
    setEditingEstablishment(est);
    setFormData({ name: est.name });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Deseja excluir este estabelecimento?')) {
      setLoading(true);
      try {
        await apiService.deleteEstablishment(id);
        await loadEstablishments();
      } catch (err) {
        console.error('Erro ao deletar estabelecimento:', err);
        setError(err.message || 'Erro ao deletar estabelecimento.');
      } finally {
        setLoading(false);
      }
    }
  };
  const handleDeactivate = async (id) => {
    if (window.confirm('Deseja desativar este estabelecimento?')) {
      setLoading(true);
      try {
        await apiService.deactivateEstablishment(id);
        await loadEstablishments();
      } catch (err) {
        console.error('Erro ao desativar estabelecimento:', err);
        setError(err.message || 'Erro ao desativar estabelecimento.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleActivate = async (id) => {
    if (window.confirm('Deseja ativar este estabelecimento?')) {
      setLoading(true);
      try {
        await apiService.activateEstablishment(id);
        await loadEstablishments();
      } catch (err) {
        console.error('Erro ao ativar estabelecimento:', err);
        setError(err.message || 'Erro ao ativar estabelecimento.');
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredEstablishments = establishments.filter((est) =>
    est.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  console.log('Estabelecimentos filtrados:', filteredEstablishments);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Estabelecimentos</h1>
          <p className="text-gray-600 mt-1">
            Adicione, edite ou remova estabelecimentos do sistema.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingEstablishment(null);
                setFormData({ name: '' });
                setError('');
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Estabelecimento
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingEstablishment ? 'Editar Estabelecimento' : 'Novo Estabelecimento'}
              </DialogTitle>
              <DialogDescription>
                {editingEstablishment
                  ? 'Edite o nome do estabelecimento.'
                  : 'Informe o nome do novo estabelecimento.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="grid gap-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nome
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="col-span-3"
                  required
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {editingEstablishment ? 'Salvar Alterações' : 'Adicionar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Buscar Estabelecimentos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Estabelecimentos</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEstablishments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum estabelecimento encontrado.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEstablishments.map((est) => (
                  <TableRow key={est.id}>
                    <TableCell className="font-medium">{est.name}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-full ${
                          est.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {est.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(est)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600"
                          onClick={() => handleDelete(est.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        {est.isActive ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-yellow-600"
                            onClick={() => handleDeactivate(est.id)}
                          >
                            Desativar
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600"
                            onClick={() => handleActivate(est.id)}
                          >
                            Ativar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EstablishmentsPage;
