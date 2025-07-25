import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

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
  const [scheduledAt, setScheduledAt] = useState(defaultValues.scheduledAt || '');
  const [establishments, setEstablishments] = useState([]);
  const [technicians, setTechnicians] = useState([]);
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
    if (user?.userType?.toLowerCase() === 'end_user') {
      setEstablishmentName(user.establishmentName || '');
    }
  }, [user]);

  // Carregar listas para ADMIN
  useEffect(() => {
    async function fetchData() {
      if (String(user?.userType).toLowerCase() === 'admin') {
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
        } catch (err) {
          console.error('Erro ao carregar listas:', err);
        } finally {
          setLoadingSelects(false);
        }
      }
    }
    fetchData();
  }, [user]);

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
        technicianName: selectedTechnician?.name || '',
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Título */}
      <div>
        <label className="block font-medium">Título *</label>
        <input
          ref={firstFieldRef}
          className={`border rounded w-full p-2 ${error.title ? 'border-red-500' : ''}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
        />
        {error.title && <p className="text-red-500 text-sm">{error.title}</p>}
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
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="border rounded w-full p-2"
          disabled={loading}
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
            onChange={(e) => setEstablishmentName(e.target.value)}
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
