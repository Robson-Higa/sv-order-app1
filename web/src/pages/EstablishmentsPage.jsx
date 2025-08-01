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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEstablishment, setEditingEstablishment] = useState(null);
  const [formData, setFormData] = useState({ name: '' });
  const [sectorsList, setSectorsList] = useState(['']);
  const [searchTerm, setSearchTerm] = useState('');

  // ✅ Setores
  const [sectors, setSectors] = useState([]);
  const [sectorInput, setSectorInput] = useState('');

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
      console.error('Erro ao carregar estabelecimentos:', err);
      setError('Erro ao carregar estabelecimentos.');
    } finally {
      setLoading(false);
    }
  };

  const loadSectors = async (establishmentId) => {
    try {
      const response = await apiService.getSectors(establishmentId);
      setSectors(response?.sectors || []);
    } catch (err) {
      console.error('Erro ao carregar setores:', err);
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
      const data = {
        name: formData.name.trim(),
        sectors: sectorsList.filter((s) => s.trim() !== ''),
      };

      if (editingEstablishment) {
        await apiService.updateEstablishment(editingEstablishment.id, data);
      } else {
        await apiService.createEstablishment(data);
      }

      await loadEstablishments();
      setIsDialogOpen(false);
      setEditingEstablishment(null);
      setFormData({ name: '' });
      setSectorsList(['']); // limpa setores
      setSectors([]);
    } catch (err) {
      console.error('Erro ao salvar estabelecimento:', err);
      setError('Erro ao salvar estabelecimento.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (est) => {
    setEditingEstablishment(est);
    setFormData({ name: est.name });
    await loadSectors(est.id);
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
        setError('Erro ao deletar estabelecimento.');
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
      } finally {
        setLoading(false);
      }
    }
  };

  // ✅ Setores
  const handleAddSector = async () => {
    if (!sectorInput.trim()) return;
    try {
      await apiService.createSector(editingEstablishment.id, { name: sectorInput.trim() });
      await loadSectors(editingEstablishment.id);
      setSectorInput('');
    } catch (err) {
      console.error('Erro ao adicionar setor:', err);
    }
  };

  const handleDeleteSector = async (sectorId) => {
    if (window.confirm('Deseja excluir este setor?')) {
      try {
        await apiService.deleteSector(editingEstablishment.id, sectorId);
        await loadSectors(editingEstablishment.id);
      } catch (err) {
        console.error('Erro ao deletar setor:', err);
      }
    }
  };

  const handleUpdateSector = async (sectorId, newName) => {
    try {
      await apiService.updateSector(editingEstablishment.id, sectorId, { name: newName });
      await loadSectors(editingEstablishment.id);
    } catch (err) {
      console.error('Erro ao atualizar setor:', err);
    }
  };

  const filteredEstablishments = establishments.filter((est) =>
    est.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gerenciar Estabelecimentos</h1>
          <p className="text-gray-600 mt-1">
            Adicione, edite ou remova estabelecimentos e seus setores.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingEstablishment(null);
                setFormData({ name: '' });
                setSectors([]);
                setError('');
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Estabelecimento
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingEstablishment ? 'Editar Estabelecimento' : 'Novo Estabelecimento'}
              </DialogTitle>
              <DialogDescription>
                Gerencie as informações e setores deste estabelecimento.
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

              {/* Campos de setores ao criar */}
              {!editingEstablishment && (
                <div className="grid gap-2">
                  <Label>Setores</Label>
                  {sectorsList.map((sector, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={sector}
                        onChange={(e) => {
                          const newList = [...sectorsList];
                          newList[index] = e.target.value;
                          setSectorsList(newList);
                        }}
                        placeholder={`Setor ${index + 1}`}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => {
                          setSectorsList(sectorsList.filter((_, i) => i !== index));
                        }}
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSectorsList([...sectorsList, ''])}
                  >
                    Adicionar Setor
                  </Button>
                </div>
              )}

              {/* Campos ao editar */}
              {editingEstablishment && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Setores Existentes</h4>
                  <ul className="space-y-2">
                    {sectors.map((sector) => (
                      <li key={sector.id} className="flex justify-between items-center">
                        <Input
                          defaultValue={sector.name}
                          onBlur={(e) => handleUpdateSector(sector.id, e.target.value)}
                          className="w-2/3"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600"
                          onClick={() => handleDeleteSector(sector.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                  {/* Adicionar novo setor */}
                  <div className="flex gap-2 mt-3">
                    <Input
                      placeholder="Novo setor"
                      value={sectorInput}
                      onChange={(e) => setSectorInput(e.target.value)}
                    />
                    <Button type="button" onClick={handleAddSector}>
                      Adicionar
                    </Button>
                  </div>
                </div>
              )}

              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingEstablishment ? 'Salvar Alterações' : 'Adicionar'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Busca */}
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
          />
        </CardContent>
      </Card>

      {/* Lista */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Estabelecimentos</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEstablishments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Nenhum estabelecimento encontrado.</div>
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
                    <TableCell>{est.name}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded-full ${
                          est.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {est.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => handleEdit(est)}
                        >
                          <Edit className="w-4 h-4" />
                          Editar
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
                            onClick={() => handleDeactivate(est.id)}
                          >
                            Desativar
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
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
