import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import OrdersByTechnicianChart from '@/components/reports/OrderByTechnicianChart';
import OrdersByEstablishmentChart from '@/components/reports/OrderByEstablishmentChart';
import GeneralOrdersChart from '@/components/reports/GeneralOrdersChart';

export default function ReportsPage() {
  const [reportCategory, setReportCategory] = useState('establishment');
  const [periodType, setPeriodType] = useState('total');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [technicians, setTechnicians] = useState([]);
  const [establishments, setEstablishments] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [selectedEstablishment, setSelectedEstablishment] = useState('');

  const getFilters = () => {
    let baseFilters = {};
    if (periodType === 'total') {
      baseFilters = {};
    } else if (periodType === 'currentMonth') {
      const now = new Date();
      baseFilters = {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString(),
      };
    } else if (periodType === 'custom') {
      baseFilters = { startDate, endDate };
    }

    return {
      ...baseFilters,
      technicianName: selectedTechnician
        ? technicians.find((t) => t.uid === selectedTechnician)?.name
        : undefined,
      establishmentId: selectedEstablishment || undefined,
    };
  };

  useEffect(() => {
    async function loadFiltersData() {
      try {
        const techs = await fetchTechnicians();
        setTechnicians(techs);

        const ests = await fetchEstablishments();
        setEstablishments(ests);
      } catch (error) {
        console.error('Erro ao carregar técnicos ou estabelecimentos:', error);
      }
    }

    loadFiltersData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const filters = getFilters();
      let response;

      if (reportCategory === 'general') {
        response = await apiService.getGeneralReport(filters);
      } else if (reportCategory === 'establishment') {
        response = await apiService.getOrdersByEstablishment(filters);
      } else if (reportCategory === 'technician') {
        response = await apiService.getOrdersByTechnician(filters);
      }

      if (response) {
        setData(response.data); // CORRETO: só o conteúdo dos dados
      } else {
        console.error('Resposta malformada:', response);
        setData(null);
      }
    } catch (error) {
      console.error('Erro ao buscar relatório:', error);
      setError('Erro ao buscar relatório');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function fetchFiltersData() {
      try {
        const techResponse = await apiService.getTechnicians(); // deve retornar lista de técnicos
        setTechnicians(techResponse.data || []);

        const estResponse = await apiService.getEstablishments(); // lista de estabelecimentos
        setEstablishments(estResponse.data || []);
      } catch (error) {
        console.error('Erro ao carregar técnicos e estabelecimentos', error);
      }
    }
    fetchFiltersData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [reportCategory, periodType, selectedTechnician, selectedEstablishment]);

  return (
    <div className="flex h-full min-h-screen bg-gray-50">
      <aside className="w-56 bg-white shadow-md p-4 flex flex-col space-y-6">
        <h2 className="text-xl font-semibold mb-4">Gerar gráficos por:</h2>
        <div>
          <h3 className="font-semibold mb-1">Técnico</h3>
          <select
            className="border rounded px-2 py-1 w-full"
            value={selectedTechnician}
            onChange={(e) => setSelectedTechnician(e.target.value)}
          >
            <option value="">Todos</option>
            {technicians.map((tech) => (
              <option key={tech.uid} value={tech.uid}>
                {tech.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <h3 className="font-semibold mb-1 mt-4">Estabelecimento</h3>
          <select
            className="border rounded px-2 py-1 w-full"
            value={selectedEstablishment}
            onChange={(e) => setSelectedEstablishment(e.target.value)}
          >
            <option value="">Todos</option>
            {establishments.map((est) => (
              <option key={est.id} value={est.id}>
                {est.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <h3 className="font-semibold mb-1">Categoria</h3>
          <div className="flex flex-col space-y-2">
            <button
              className={`py-2 px-3 rounded hover:bg-gray-200 ${
                reportCategory === 'establishment' ? 'bg-gray-300 font-bold' : ''
              }`}
              onClick={() => setReportCategory('establishment')}
            >
              Estabelecimento
            </button>
            <button
              className={`py-2 px-3 rounded hover:bg-gray-200 ${
                reportCategory === 'technician' ? 'bg-gray-300 font-bold' : ''
              }`}
              onClick={() => setReportCategory('technician')}
            >
              Técnico
            </button>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-1">Período</h3>
          <div className="flex flex-col space-y-2">
            <button
              className={`py-2 px-3 rounded hover:bg-gray-200 ${
                periodType === 'total' ? 'bg-gray-300 font-bold' : ''
              }`}
              onClick={() => setPeriodType('total')}
            >
              Total
            </button>
            <button
              className={`py-2 px-3 rounded hover:bg-gray-200 ${
                periodType === 'currentMonth' ? 'bg-gray-300 font-bold' : ''
              }`}
              onClick={() => setPeriodType('currentMonth')}
            >
              Mês Atual
            </button>
            <button
              className={`py-2 px-3 rounded hover:bg-gray-200 ${
                periodType === 'custom' ? 'bg-gray-300 font-bold' : ''
              }`}
              onClick={() => setPeriodType('custom')}
            >
              Período Personalizado
            </button>
          </div>
        </div>

        {periodType === 'custom' && (
          <div className="flex flex-col space-y-2 mt-2">
            <label className="font-medium">Data Inicial:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border rounded px-2 py-1"
            />
            <label className="font-medium">Data Final:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border rounded px-2 py-1"
            />
            <button className="bg-blue-600 text-white rounded px-3 py-1 mt-2" onClick={fetchData}>
              Atualizar
            </button>
          </div>
        )}
      </aside>

      <main className="flex-1 p-6 overflow-auto">
        <h1 className="text-2xl font-bold mb-6">Relatórios de Atendimento</h1>

        {loading && <p>Carregando dados...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && data && (
          <>
            {reportCategory === 'general' && <GeneralOrdersChart data={data} />}
            {reportCategory === 'establishment' && <OrdersByEstablishmentChart data={data} />}
            {reportCategory === 'technician' && <OrdersByTechnicianChart data={data} />}
          </>
        )}

        {!loading && !data && <p>Nenhum dado para exibir.</p>}
      </main>
    </div>
  );
}
