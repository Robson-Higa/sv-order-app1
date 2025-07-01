import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const priorities = [
  { value: 'LOW', label: 'Baixa' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HIGH', label: 'Alta' },
];

function getUserTypeLabel(userType) {
  switch (userType) {
    case 'ADMIN':
    case 'admin':
      return 'Administrador';
    case 'TECHNICIAN':
    case 'technician':
      return 'Técnico';
    case 'END_USER':
    case 'end_user':
      return 'Usuário Final';
    default:
      return 'Desconhecido';
  }
}

function UserInfo({ user }) {
  if (!user) return null;
  return (
    <div className="mb-4 p-2 bg-gray-50 rounded border text-sm">
      <strong>Nome:</strong> {user.name} <br />
      <strong>Tipo:</strong> {getUserTypeLabel(user.userType)}
    </div>
  );
}

const ServiceOrderCreatePage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM');
  const [establishmentName, setEstablishmentName] = useState('');
  const [technicianName, setTechnicianName] = useState('');
  const [establishments, setEstablishments] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      if (String(user?.userType).toLowerCase() === 'admin') {
        try {
          const headers = {
            Authorization: `Bearer ${token}`,
          };
          const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

          const resEstablishments = await fetch(`${baseURL}/api/establishments`, { headers });
          if (!resEstablishments.ok) throw new Error('Erro ao buscar estabelecimentos');
          const dataEstablishments = await resEstablishments.json();
          setEstablishments(dataEstablishments.establishments || []);

          const resTechnicians = await fetch(`${baseURL}/api/users/technicians`, { headers });
          if (!resTechnicians.ok) throw new Error('Erro ao buscar técnicos');
          const dataTechnicians = await resTechnicians.json();
          setTechnicians(dataTechnicians.technicians || []);
        } catch (err) {
          console.error('Erro ao buscar estabelecimentos ou técnicos:', err);
          setEstablishments([]);
          setTechnicians([]);
        }
      }
    }

    fetchData();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        title,
        description,
        priority,
        establishment: { name: establishmentName },
        technician: { name: technicianName },
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

      setLoading(false);
      navigate('/service-orders');
    } catch (err) {
      console.error('Erro ao criar ordem:', err);
      setError('Erro ao criar ordem de serviço. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded shadow max-w-lg w-full">
        <UserInfo user={user} />
        <h1 className="text-2xl font-bold mb-4">Criar Nova Ordem de Serviço</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium mb-1">Título</label>
            <input
              className="border rounded w-full p-2"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da ordem"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Descrição</label>
            <textarea
              className="border rounded w-full p-2"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o problema ou solicitação"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Prioridade</label>
            <select
              className="border rounded w-full p-2"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              {priorities.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1">Estabelecimento</label>
            <select
              className="border rounded w-full p-2"
              required
              value={establishmentName}
              onChange={(e) => setEstablishmentName(e.target.value)}
            >
              <option value="">Selecione...</option>
              {establishments.map((est) => (
                <option key={est.id} value={est.name}>
                  {est.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1">Técnico (opcional)</label>
            <select
              className="border rounded w-full p-2"
              value={technicianName}
              onChange={(e) => setTechnicianName(e.target.value)}
            >
              <option value="">Não atribuir</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.name}>
                  {tech.name}
                </option>
              ))}
            </select>
          </div>
          {error && <div className="text-red-600">{error}</div>}
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Criar Ordem'}
            </button>
            <button
              type="button"
              className="border px-4 py-2 rounded"
              onClick={() => navigate('/service-orders')}
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceOrderCreatePage;
