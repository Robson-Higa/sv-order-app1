import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import { apiService } from '../../services/api';

const priorities = [
  { value: 'LOW', label: 'Baixa' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HIGH', label: 'Alta' },
];

const ServiceOrderForm = ({ onSuccess, onCancel, defaultValues = {} }) => {
  const { user } = useAuth();

  const [title, setTitle] = useState(defaultValues.title || '');
  const [description, setDescription] = useState(defaultValues.description || '');
  const [priority, setPriority] = useState(defaultValues.priority || 'MEDIUM');
  const [establishmentName, setEstablishmentName] = useState(defaultValues.establishmentName || '');
  const [technicianId, setTechnicianId] = useState(defaultValues.technicianId || '');
  const [sector, setSector] = useState(defaultValues.sector || '');
  const today = new Date().toISOString().split('T')[0];
  const [scheduledAt, setScheduledAt] = useState(defaultValues.scheduledAt || today);

  const [establishments, setEstablishments] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [titles, setTitles] = useState([]);
  const [sectors, setSectors] = useState([]);

  const [loading, setLoading] = useState(false);
  const [loadingSelects, setLoadingSelects] = useState(false);
  const [error, setError] = useState({});
  const firstFieldRef = useRef(null);

  /** Foco no primeiro campo */
  useEffect(() => {
    if (firstFieldRef.current) firstFieldRef.current.focus();
  }, []);

  /** Buscar títulos para todos os usuários */
  useEffect(() => {
    async function fetchTitles() {
      try {
        const res = await apiService.getTitles();
        // Garanta que cada title tenha id (se seu backend já envia, ok)
        // Se não enviar, aqui você pode mapear e criar um id baseado em algo único
        const titlesWithId = (res.titles || []).map((title) => ({
          id: title.id || title.title, // fallback para title se não houver id
          ...title,
        }));
        setTitles(titlesWithId);
      } catch (err) {
        console.error('Erro ao buscar títulos:', err);
      }
    }
    fetchTitles();
  }, []);

  /** Preenche estabelecimento para END_USER e busca setores */
  useEffect(() => {
    if (user?.userType?.toLowerCase() === 'end_user' && user.establishmentId) {
      fetchEstablishmentAndSectors(user.establishmentId);
    }
  }, [user]);

  const fetchEstablishmentAndSectors = async (establishmentId) => {
    try {
      const establishment = await apiService.getEstablishments();
      const current = establishment.establishments.find((e) => e.id === establishmentId);
      if (current) {
        setEstablishmentName(current.name);

        const response = await apiService.getSectors(establishmentId);
        const sectorsWithId = (response.sectors || []).map((sector) => ({
          id: sector.id || sector.name,
          ...sector,
        }));

        setSectors(sectorsWithId);

        setSectors(sectorsWithId);
        console.log('Estabelecimentos:', establishments);
        console.log('Estabelecimento atual:', current);
        console.log('Setores carregados:', sectors);
      }
    } catch (err) {
      console.error('Erro ao buscar nome do estabelecimento:', err);
    }
  };

  /** Buscar dados para ADMIN (estabelecimentos, técnicos) */
  useEffect(() => {
    if (user?.userType?.toLowerCase() === 'admin') {
      loadAdminData();
    }
  }, [user]);

  const loadAdminData = async () => {
    setLoadingSelects(true);
    try {
      const [estResp, techResp] = await Promise.all([
        apiService.getEstablishments(),
        apiService.getTechnicians(),
      ]);
      setEstablishments(estResp.establishments || []);
      setTechnicians(techResp.technicians || []);
    } catch (err) {
      console.error('Erro ao carregar listas:', err);
    } finally {
      setLoadingSelects(false);
    }
  };

  const fetchSectorsByEstablishment = async (establishmentId) => {
    try {
      const res = await apiService.getSectors(establishmentId);
      setSectors(res.sectors || []);
    } catch (err) {
      console.error('Erro ao buscar setores:', err);
      setSectors([]);
    }
  };

  /** Validação */
  const validateForm = () => {
    const errors = {};
    if (!title.trim()) errors.title = 'O título é obrigatório.';
    if (!description.trim()) errors.description = 'A descrição é obrigatória.';
    if (!establishmentName) errors.establishmentName = 'Selecione um estabelecimento.';
    setError(errors);
    return Object.keys(errors).length === 0;
  };

  /** Submit */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        priority,
        establishmentName,
        sector,
        ...(scheduledAt && { scheduledAt }),
        ...(technicianId && { technicianId }),
      };

      await apiService.createServiceOrder(payload);

      toast.success('Ordem criada com sucesso!');
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Erro:', err);
      toast.error('Erro ao criar ordem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Título */}
      <div>
        <label className="block font-medium mb-1">Título *</label>
        <Autocomplete
          options={titles}
          getOptionLabel={(option) => option.title || ''}
          value={titles.find((t) => t.title === title) || null}
          onChange={(_, newValue) => {
            if (typeof newValue === 'string') {
              setTitle(newValue);
            } else if (newValue && newValue.title) {
              setTitle(newValue.title);
            } else {
              setTitle('');
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              inputRef={firstFieldRef} // <-- aqui
              placeholder="Selecione ou digite o título"
              variant="outlined"
              size="small"
              error={!!error.title}
              helperText={error.title}
            />
          )}
          disabled={loading}
          freeSolo
        />
      </div>

      {/* Descrição */}
      <div>
        <label className="block font-medium">Descrição *</label>
        <textarea
          className={`border rounded w-full p-2 ${error.description ? 'border-red-500' : ''}`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
        />
        {error.description && <p className="text-red-500 text-sm">{error.description}</p>}
      </div>

      {/* Agendamento */}
      <div>
        <label className="block font-medium">Agendar para:</label>
        <input
          type="date"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="border rounded w-full p-2"
          disabled={loading}
          min={today}
        />
      </div>

      {/* Prioridade */}
      <div>
        <label className="block font-medium">Prioridade</label>
        <select
          className="border rounded w-full p-2"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          disabled={loading}
        >
          {priorities.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Estabelecimento */}
      <div>
        <label className="block font-medium">Estabelecimento *</label>
        {user?.userType?.toLowerCase() === 'end_user' ? (
          <input
            className="border rounded w-full p-2 bg-gray-100"
            value={establishmentName}
            disabled
          />
        ) : (
          <select
            className={`border rounded w-full p-2 ${error.establishmentName ? 'border-red-500' : ''}`}
            value={establishmentName}
            onChange={(e) => {
              const selectedName = e.target.value;
              setEstablishmentName(selectedName);
              setSector('');
              const selectedEst = establishments.find((est) => est.name === selectedName);
              if (selectedEst) fetchSectorsByEstablishment(selectedEst.id);
              else setSectors([]);
            }}
            disabled={loading || loadingSelects}
          >
            <option value="">Selecione...</option>
            {establishments.map((est) => (
              <option key={est.id} value={est.name}>
                {est.name}
              </option>
            ))}
          </select>
        )}
        {error.establishmentName && (
          <p className="text-red-500 text-sm">{error.establishmentName}</p>
        )}
      </div>

      {/* Setor */}
      <div>
        <label className="block font-medium mb-1">Setor *</label>
        <Autocomplete
          options={sectors}
          freeSolo
          getOptionLabel={(option) => {
            if (typeof option === 'string') return option; // quando usuário digita
            return option?.name || ''; // mostrar nome
          }}
          isOptionEqualToValue={(option, value) => {
            if (typeof value === 'string') return option.name === value;
            return option.id === value.id;
          }}
          value={typeof sector === 'string' ? sectors.find((s) => s.id === sector) || sector : null}
          onChange={(_, newValue) => {
            if (typeof newValue === 'string') {
              setSector(newValue); // novo setor digitado
            } else if (newValue && newValue.name) {
              setSector(newValue.name); // salvar o nome do setor
            } else {
              setSector('');
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Selecione ou digite o setor"
              variant="outlined"
              size="small"
            />
          )}
          disabled={loading}
        />
      </div>

      {/* Técnico (somente admin) */}
      {user?.userType?.toLowerCase() === 'admin' && (
        <div>
          <label className="block font-medium">Técnico</label>
          <select
            className="border rounded w-full p-2"
            value={technicianId}
            onChange={(e) => setTechnicianId(e.target.value)}
            disabled={loading || loadingSelects}
          >
            <option value="">Não atribuir</option>
            {technicians.map((tech) => (
              <option key={tech.id} value={tech.id}>
                {' '}
                {/* use tech.id aqui */}
                {tech.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Botões */}
      <div className="flex gap-3 mt-4">
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
          disabled={loading}
        >
          {loading ? 'Salvando...' : 'Criar Ordem'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="border px-4 py-2 rounded hover:bg-gray-100"
            disabled={loading}
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
};

export default ServiceOrderForm;
