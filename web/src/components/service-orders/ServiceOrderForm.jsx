import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

const priorities = [
  { value: 'LOW', label: 'Baixa' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HIGH', label: 'Alta' },
];

const ServiceOrderForm = ({ onSuccess, onCancel, defaultValues = {} }) => {
  const { user, token } = useAuth();

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

  // Foco no primeiro campo
  useEffect(() => {
    if (firstFieldRef.current) firstFieldRef.current.focus();
  }, []);

  // Preenche estabelecimento para END_USER
  useEffect(() => {
    async function fetchEstablishmentName() {
      if (user?.userType?.toLowerCase() === 'end_user' && user.establishmentId) {
        try {
          const headers = { Authorization: `Bearer ${token}` };
          const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
          const res = await fetch(`${baseURL}/api/establishments/${user.establishmentId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!res.ok) throw new Error('Erro ao buscar estabelecimento');

          const data = await res.json();
          setEstablishmentName(data.name || '');

          // Agora busca os setores desse estabelecimento
          fetchSectorsByEstablishment(user.establishmentId);
        } catch (err) {
          console.error('Erro ao buscar nome do estabelecimento:', err);
        }
      }
    }

    fetchEstablishmentName();
  }, [user, token]);

  // Carregar listas para ADMIN
  // Buscar títulos (para todos os usuários)
  useEffect(() => {
    async function fetchTitles() {
      try {
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const res = await fetch(`${baseURL}/api/titles`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setTitles(data.titles || []);
      } catch (err) {
        console.error('Erro ao buscar títulos:', err);
      }
    }
    fetchTitles();
  }, [token]);

  // Buscar dados para ADMIN
  useEffect(() => {
    async function fetchData() {
      if (user?.userType?.toLowerCase() === 'admin') {
        setLoadingSelects(true);
        try {
          const headers = { Authorization: `Bearer ${token}` };
          const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

          const resEstablishments = await fetch(`${baseURL}/api/establishments`, { headers });
          const dataEstablishments = await resEstablishments.json();
          setEstablishments(dataEstablishments.establishments || []);

          const resTechnicians = await fetch(`${baseURL}/api/users/technicians`, { headers });
          const dataTechnicians = await resTechnicians.json();
          setTechnicians(dataTechnicians.technicians || []);

          const resSectors = await fetch(`${baseURL}/api/sectors`, { headers });
          const dataSectors = await resSectors.json();
          setSectors(dataSectors.sectors || []);
        } catch (err) {
          console.error('Erro ao carregar listas:', err);
        } finally {
          setLoadingSelects(false);
        }
      }
    }
    fetchData();
  }, [user, token]);

  const validateForm = () => {
    const errors = {};
    if (!title.trim()) errors.title = 'O título é obrigatório.';
    if (!description.trim()) errors.description = 'A descrição é obrigatória.';
    if (!establishmentName) errors.establishmentName = 'Selecione um estabelecimento.';
    setError(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const selectedTechnician = technicians.find((t) => t.id === technicianId);

      const payload = {
        title: title.trim(),
        description: description.trim(),
        priority,
        establishmentName,
        ...(scheduledAt && { scheduledAt }),
      };

      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const response = await fetch(`${baseURL}/api/service-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Erro ao criar ordem');

      toast.success('Ordem criada com sucesso!');
      if (onSuccess) onSuccess(); // ✅ Fechar modal ou redirecionar
    } catch (err) {
      console.error('Erro:', err);
      toast.error('Erro ao criar ordem.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSectorsByEstablishment = async (establishmentId) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

      const res = await fetch(`${baseURL}/api/establishments/${establishmentId}/sectors`, {
        headers,
      });

      if (!res.ok) throw new Error('Erro ao buscar setores');

      const data = await res.json();
      setSectors(data.sectors || []);
    } catch (err) {
      console.error('Erro ao buscar setores:', err);
      setSectors([]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Título com Autocomplete */}
      <div>
        <label className="block font-medium mb-1">Título *</label>
        <Autocomplete
          options={titles}
          getOptionLabel={(option) => option.title || ''}
          value={titles.find((t) => t.title === title) || null}
          onChange={(_, newValue) => setTitle(newValue ? newValue.title : '')}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Selecione ou digite o título"
              variant="outlined"
              size="small"
              error={!!error.title}
              helperText={error.title}
            />
          )}
          disabled={loading}
          freeSolo // permite digitar livremente, se desejar
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
          min={today} // Impede datas passadas
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

      {/* Setor com Autocomplete */}
      <div>
        <label className="block font-medium mb-1">Setor *</label>
        <Autocomplete
          options={sectors}
          getOptionLabel={(option) => option.name || ''}
          value={sectors.find((s) => s.name === sector) || null}
          onChange={(_, newValue) => setSector(newValue ? newValue.name : '')}
          renderInput={(params) => (
            <TextField
              {...params}
              placeholder="Selecione ou digite o setor"
              variant="outlined"
              size="small"
            />
          )}
          disabled={loading || sectors.length === 0}
        />
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
              setSector(''); // resetar setor
              const selectedEst = establishments.find((est) => est.name === selectedName);
              if (selectedEst) {
                fetchSectorsByEstablishment(selectedEst.id);
              } else {
                setSectors([]);
              }
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

      {/* Técnico */}
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
