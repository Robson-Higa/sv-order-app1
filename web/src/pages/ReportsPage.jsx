import React, { useEffect, useState } from 'react';
import { apiService } from '@/services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

const ReportsPage = () => {
  const [orders, setOrders] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  // Função para buscar dados do relatório
  const fetchOrders = async () => {
    if (!startDate || !endDate) {
      alert('Selecione um período válido');
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.getOrdersReport({ startDate, endDate });
      setOrders(response.orders || []);
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Gerar PDF profissional
  const exportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');

    // Cabeçalho
    doc.setFontSize(18);
    doc.text('Relatório de Ordens de Serviço', 14, 15);

    doc.setFontSize(11);
    doc.text(`Período: ${startDate} até ${endDate}`, 14, 25);
    doc.text(`Data de geração: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 32);

    // Tabela
    const tableColumn = [
      'Nº OS',
      'Título',
      'Status',
      'Técnico',
      'Estabelecimento',
      'Criado em',
      'Solução',
      'Feedback',
      'Motivo Cancelamento',
    ];

    const tableRows = orders.map((order) => [
      order.orderNumber,
      order.title,
      order.status,
      order.technicianName || '-',
      order.establishmentName || '-',
      order.createdAt || '-',
      order.solution || '-',
      order.feedback || '-',
      order.cancelReason || '-',
    ]);

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
    });

    doc.save(`relatorio-os-${startDate}-a-${endDate}.pdf`);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Relatórios</h1>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Data Inicial</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded px-3 py-2 w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Data Final</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border rounded px-3 py-2 w-full"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={fetchOrders}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
          >
            Gerar Relatório
          </button>
        </div>
        {orders.length > 0 && (
          <div className="flex items-end">
            <button
              onClick={exportPDF}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full"
            >
              Exportar PDF
            </button>
          </div>
        )}
      </div>

      {/* Tabela de resultados */}
      <div className="overflow-x-auto bg-white rounded shadow">
        {loading ? (
          <p className="p-4">Carregando...</p>
        ) : orders.length === 0 ? (
          <p className="p-4">Nenhum dado encontrado para este período.</p>
        ) : (
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left border-b">Nº OS</th>
                <th className="px-4 py-2 text-left border-b">Título</th>
                <th className="px-4 py-2 text-left border-b">Status</th>
                <th className="px-4 py-2 text-left border-b">Técnico</th>
                <th className="px-4 py-2 text-left border-b">Estabelecimento</th>
                <th className="px-4 py-2 text-left border-b">Criado em</th>
                <th className="px-4 py-2 text-left border-b">Solução</th>
                <th className="px-4 py-2 text-left border-b">Feedback</th>
                <th className="px-4 py-2 text-left border-b">Cancelamento</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-b">{order.orderNumber}</td>
                  <td className="px-4 py-2 border-b">{order.title}</td>
                  <td className="px-4 py-2 border-b">{order.status}</td>
                  <td className="px-4 py-2 border-b">{order.technicianName || '-'}</td>
                  <td className="px-4 py-2 border-b">{order.establishmentName || '-'}</td>
                  <td className="px-4 py-2 border-b">{order.createdAt}</td>
                  <td className="px-4 py-2 border-b">{order.solution || '-'}</td>
                  <td className="px-4 py-2 border-b">{order.feedback || '-'}</td>
                  <td className="px-4 py-2 border-b">{order.cancelReason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
