import React, { useEffect, useRef, useState } from 'react';
import { apiService } from '@/services/api';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

const DetailedReportPage = () => {
  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState({ technicianName: '', establishmentName: '' });
  const [technicians, setTechnicians] = useState([]);
  const [establishments, setEstablishments] = useState([]);
  const [loading, setLoading] = useState(true);
  const reportRef = useRef();

  // KPIs
  const totalOrders = orders.length;
  const completed = orders.filter((o) => o.status === 'CONCLUIDA').length;
  const inProgress = orders.filter((o) => o.status === 'EM_ANDAMENTO').length;
  const cancelled = orders.filter((o) => o.status === 'CANCELADA').length;

  const statusData = [
    { name: 'Concluídas', value: completed },
    { name: 'Em Andamento', value: inProgress },
    { name: 'Canceladas', value: cancelled },
  ];

  const ordersByTechnician = Object.entries(
    orders.reduce((acc, o) => {
      acc[o.technicianName] = (acc[o.technicianName] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const fetchFilters = async () => {
    try {
      const [techRes, estabRes] = await Promise.all([
        apiService.getTechnicians(),
        apiService.getEstablishments(),
      ]);
      setTechnicians(techRes.users || []);
      setEstablishments(estabRes.establishments || []);
    } catch (err) {
      console.error('Erro ao buscar filtros', err);
    }
  };

  const fetchOrders = async (filters) => {
    setLoading(true);
    try {
      const query = {};
      if (filters.technicianName) query.technicianName = filters.technicianName;
      if (filters.establishmentName) query.establishmentName = filters.establishmentName;

      const res = await apiService.getCompletedOrdersByDate(query);
      setOrders(res || []);
    } catch (err) {
      console.error('Erro ao buscar ordens', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
    fetchOrders(filters);
  }, []);

  useEffect(() => {
    fetchOrders(filters);
  }, [filters]);

  const exportPDF = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // CAPA
    pdf.setFontSize(22);
    pdf.text('Relatório de Ordens de Serviço', pdfWidth / 2, 40, { align: 'center' });
    pdf.setFontSize(14);
    pdf.text(`Emitido em: ${new Date().toLocaleDateString()}`, pdfWidth / 2, 60, {
      align: 'center',
    });
    pdf.text(`Período: ${new Date().toLocaleDateString()}`, pdfWidth / 2, 70, { align: 'center' });

    // Logo
    const logo = document.querySelector('#report-logo');
    if (logo) {
      const logoCanvas = await html2canvas(logo);
      const imgData = logoCanvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', pdfWidth / 2 - 30, 80, 60, 60);
    }

    pdf.addPage();

    // SUMÁRIO EXECUTIVO
    pdf.setFontSize(18);
    pdf.text('Resumo Executivo', 14, 20);
    pdf.setFontSize(12);
    pdf.text(`Total OS: ${totalOrders}`, 14, 35);
    pdf.text(`Concluídas: ${completed}`, 14, 45);
    pdf.text(`Em Andamento: ${inProgress}`, 14, 55);
    pdf.text(`Canceladas: ${cancelled}`, 14, 65);

    pdf.addPage();

    // GRÁFICOS (captura seção gráfica)
    const chartsSection = document.querySelector('#charts-section');
    if (chartsSection) {
      const canvasCharts = await html2canvas(chartsSection, { scale: 2 });
      const imgDataCharts = canvasCharts.toDataURL('image/png');
      const imgHeight = (canvasCharts.height * pdfWidth) / canvasCharts.width;
      pdf.addImage(imgDataCharts, 'PNG', 0, 20, pdfWidth, imgHeight);
    }

    // Detalhamento em páginas múltiplas
    pdf.addPage();
    pdf.setFontSize(16);
    pdf.text('Detalhamento das Ordens', 14, 20);

    let y = 30;
    pdf.setFontSize(10);
    orders.forEach((os, index) => {
      const line = `${os.id} | ${os.title} | ${os.establishmentName} | ${os.technicianName} | ${os.status}`;
      pdf.text(line, 14, y);
      y += 7;
      if (y > pdfHeight - 20) {
        pdf.addPage();
        y = 20;
      }
    });

    pdf.save(`relatorio-detalhado-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Relatório Detalhado</h1>

      {/* Filtros */}
      <div className="flex gap-4 mb-6">
        <select
          value={filters.technicianName}
          onChange={(e) => setFilters({ technicianName: e.target.value, establishmentName: '' })}
          className="border rounded px-2 py-1"
        >
          <option value="">Todos Técnicos</option>
          {technicians.map((t) => (
            <option key={t.uid} value={t.name}>
              {t.name}
            </option>
          ))}
        </select>

        <select
          value={filters.establishmentName}
          onChange={(e) => setFilters({ establishmentName: e.target.value, technicianName: '' })}
          className="border rounded px-2 py-1"
        >
          <option value="">Todos Estabelecimentos</option>
          {establishments.map((e) => (
            <option key={e.id} value={e.name}>
              {e.name}
            </option>
          ))}
        </select>
      </div>

      {/* Conteúdo */}
      <div ref={reportRef} className="bg-white p-6 rounded-xl shadow">
        <header className="border-b pb-4 mb-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Relatório de Ordens de Serviço</h2>
            <p className="text-sm text-gray-600">Emitido em {new Date().toLocaleDateString()}</p>
          </div>
          <img id="report-logo" src="/src/assets/images/logo-aqu.6cc27101.png" alt="Logo" className="h-16" />
        </header>

        {/* KPIs */}
        <section className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-100 p-4 text-center rounded">
            <p className="text-lg font-bold">{totalOrders}</p>
            <p>Total OS</p>
          </div>
          <div className="bg-green-100 p-4 text-center rounded">
            <p className="text-lg font-bold">{completed}</p>
            <p>Concluídas</p>
          </div>
          <div className="bg-yellow-100 p-4 text-center rounded">
            <p className="text-lg font-bold">{inProgress}</p>
            <p>Em Andamento</p>
          </div>
          <div className="bg-red-100 p-4 text-center rounded">
            <p className="text-lg font-bold">{cancelled}</p>
            <p>Canceladas</p>
          </div>
        </section>

        {/* Gráficos */}
        <section id="charts-section" className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="mb-2 font-semibold">Distribuição por Status</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} dataKey="value" outerRadius={80}>
                  {statusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div>
            <h3 className="mb-2 font-semibold">OS por Técnico</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ordersByTechnician}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <button
        onClick={exportPDF}
        className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 mt-4"
      >
        Exportar PDF
      </button>
    </div>
  );
};

export default DetailedReportPage;
