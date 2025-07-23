import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import OrdersByTechnicianChart from '@/components/reports/OrderByTechnicianChart';
import OrdersByEstablishmentChart from '@/components/reports/OrderByEstablishmentChart';
import GeneralOrdersChart from '@/components/reports/GeneralOrdersChart';
import { fetchTechnicians, fetchEstablishments } from '@/services/api';

export default function ReportsPage() {
  const [reportCategory, setReportCategory] = useState('establishment');
  const [periodType, setPeriodType] = useState('total');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [technicians, setTechnicians] = useState([]);
  const [establishments, setEstablishments] = useState([]);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [selectedEstablishment, setSelectedEstablishment] = useState('');

  const getFilters = () => {
    let baseFilters = {};
    if (periodType === 'currentMonth') {
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

  const formatChartData = (rawData) => {
    if (!rawData) return [];

    if (Array.isArray(rawData)) return rawData;

    return Object.entries(rawData).map(([name, value]) => ({
      name,
      value,
    }));
  };

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
        setData(formatChartData(response.data));
      } else {
        setData([]);
      }
    } catch (error) {
      console.error('Erro ao buscar relatório:', error);
      setError('Erro ao buscar relatório');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadFiltersData() {
      try {
        const techs = await fetchTechnicians();
        setTechnicians(techs);
        const estabs = await fetchEstablishments();
        setEstablishments(estabs);
      } catch (error) {
        console.error('Erro ao carregar técnicos e estabelecimentos:', error);
      }
    }

    loadFiltersData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [reportCategory, periodType, selectedTechnician, selectedEstablishment]);

  return (
    <div className="flex h-full min-h-screen bg-gray-50">
      <aside className="w-56 bg-white shadow-md p-4 flex flex-col space-y-6">
        <h2 className="text-xl font-semibold mb-4">Relatórios</h2>
        <div>
          <h3 className="font-semibold mb-1">Categoria</h3>
          <select
            className="border rounded px-2 py-1 w-full"
            value={reportCategory}
            onChange={(e) => setReportCategory(e.target.value)}
          >
            <option value="general">Geral</option>
            <option value="establishment">Por Estabelecimento</option>
            <option value="technician">Por Técnico</option>
          </select>
        </div>
        {/* Filtros adicionais aqui */}
      </aside>

      <main className="flex-1 p-6 overflow-auto">
        <h1 className="text-2xl font-bold mb-6">Relatórios de Atendimento</h1>
        {loading && <p>Carregando dados...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && data.length > 0 && (
          <>
            {reportCategory === 'general' && <GeneralOrdersChart data={data} />}
            {reportCategory === 'establishment' && <OrdersByEstablishmentChart data={data} />}
            {reportCategory === 'technician' && <OrdersByTechnicianChart data={data} />}
          </>
        )}

        {!loading && data.length === 0 && <p>Nenhum dado para exibir.</p>}
      </main>
    </div>
  );
}
