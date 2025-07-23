import React, { useEffect, useState } from 'react';
import { apiService } from '@/services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import ChartSkeleton from '@/components/reports/ChartSkeleton';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ReportsPage = () => {
  const [monthlyData, setMonthlyData] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [establishments, setEstablishments] = useState([]);
  const [filters, setFilters] = useState({
    technicianName: '',
    establishmentName: '',
  });
  const [loading, setLoading] = useState(true);
  const fetchFilters = async () => {
    try {
      const [techRes, estabRes] = await Promise.all([
        apiService.getTechnicians(), // retorna { users: [...] }
        apiService.getEstablishments(), // retorna { establishments: [...] }
      ]);

      console.log('Resposta técnicos:', techRes);
      console.log('Resposta estabelecimentos:', estabRes);

      setTechnicians(techRes.users || []); // <-- usa .users porque API retorna {users}
      setEstablishments(estabRes.establishments || []);
    } catch (error) {
      console.error('Erro ao carregar filtros', error);
      setTechnicians([]);
      setEstablishments([]);
    }
  };

  // Carregar dados mensais filtrados
  const fetchMonthlyData = async (filters) => {
    try {
      setLoading(true);
      const query = {};
      if (filters.technicianName) query.technicianName = filters.technicianName;
      if (filters.establishmentName) query.establishmentName = filters.establishmentName;

      const res = await apiService.getCompletedOrdersByDate(query);
      //console.log('Resposta completa:', res);

      setMonthlyData(res || []);
    } catch (error) {
      console.error('Erro ao carregar dados mensais', error);
      setMonthlyData([]);
    } finally {
      setLoading(false);
    }
  };

  // Inicializar filtros e dados gerais
  useEffect(() => {
    fetchFilters();
    fetchMonthlyData({ technicianName: '', establishmentName: '' });
  }, []);

  // Atualizar dados ao mudar filtros
  useEffect(() => {
    fetchMonthlyData(filters);
  }, [filters]);

  // Exportar PDF do gráfico
  const exportPDF = async () => {
    const reportSection = document.getElementById('report-section');
    if (!reportSection) return;

    const canvas = await html2canvas(reportSection, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.setFontSize(16);
    pdf.text('Relatório de Ordens de Serviço', 10, 15);
    pdf.addImage(imgData, 'PNG', 10, 25, pdfWidth - 20, pdfHeight);
    pdf.save(`relatorio-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Relatórios</h1>

      {/* Dropdown Técnico */}
      <div className="mb-4">
        <label className="block text-sm mb-1">Técnico</label>
        <select
          value={filters.technicianName}
          onChange={(e) =>
            setFilters((prev) => ({
              technicianName: e.target.value,
              establishmentName: '',
            }))
          }
          className="border rounded px-2 py-1"
        >
          <option value="">Todos</option>
          {technicians.map((t) => (
            <option key={t.uid} value={t.name.toLowerCase()}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Dropdown Estabelecimento */}
      <div className="mb-6">
        <label className="block text-sm mb-1">Estabelecimento</label>
        <select
          value={filters.establishmentName}
          onChange={(e) =>
            setFilters((prev) => ({
              establishmentName: e.target.value,
              technicianName: '',
            }))
          }
          className="border rounded px-2 py-1"
        >
          <option value="">Todos</option>
          {establishments.map((e) => (
            <option key={e.id} value={e.name.toLowerCase()}>
              {e.name}
            </option>
          ))}
        </select>
      </div>

      {/* Gráfico mensal */}
      <div id="report-section" className="bg-white p-4 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold mb-4">Ordens por Mês</h2>
        {loading ? (
          <ChartSkeleton title="Carregando gráfico..." />
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" fill="#60a5fa" name="Abertas" />
              <Bar dataKey="completed" fill="#10b981" name="Concluídas" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Botão exportar PDF */}
      <button
        onClick={exportPDF}
        className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 mt-4"
      >
        Exportar PDF
      </button>
    </div>
  );
};

export default ReportsPage;
