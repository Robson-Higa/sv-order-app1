import React, { useState } from 'react';
import { apiService } from '@/services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';

// Registrar todos os componentes necessários
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title);

const ReportsPage = () => {
  const [orders, setOrders] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

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

  // Adicione esta função utilitária no seu componente
  const traduzirStatus = (status) => {
    if (!status) return 'Desconhecido';

    const statusLower = status.toLowerCase().trim();

    const mapeamento = {
      open: 'Aberto',
      opened: 'Aberto',
      pending: 'Pendente',
      'in progress': 'Em Andamento',
      completed: 'Concluído',
      closed: 'Fechado',
      cancelled: 'Cancelado',
      canceled: 'Cancelado',
      resolved: 'Resolvido',
      reopened: 'Reaberto',
    };

    return mapeamento[statusLower] || status; // Mantém o original se não encontrar tradução
  };

  const generateHorizontalBarChart = async (data, title) => {
    const translatedData = {};
    Object.entries(data).forEach(([status, count]) => {
      const translatedStatus = traduzirStatus(status);
      translatedData[translatedStatus] = (translatedData[translatedStatus] || 0) + count;
    });

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');

    const total = Object.values(translatedData).reduce((sum, value) => sum + value, 0);
    const labels = Object.keys(translatedData);
    const values = Object.values(translatedData);

    return new Promise((resolve) => {
      const chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Quantidade',
              data: values,
              backgroundColor: [
                '#36a2ebaa',
                '#4bc0c0aa',
                '#ff9f40aa',
                '#ff6384aa',
                '#9966ffaa',
                '#ffcd56aa',
                '#c9cbcfaa',
              ],
              borderColor: [
                '#36a2eb',
                '#4bc0c0',
                '#ff9f40',
                '#ff6384',
                '#9966ff',
                '#ffcd56',
                '#c9cbcf',
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          indexAxis: 'y',
          responsive: false,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: title,
              font: {
                size: 16,
                weight: 'bold',
              },
              padding: {
                top: 10,
                bottom: 20,
              },
            },
            legend: {
              display: false,
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const value = context.raw;
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${value} ordens (${percentage}%)`;
                },
              },
            },
          },
          scales: {
            x: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Quantidade de Ordens',
                font: {
                  weight: 'bold',
                },
              },
              ticks: {
                callback: function (value) {
                  return value;
                },
              },
            },
            y: {
              title: {
                display: true,
                text: 'Status',
                font: {
                  weight: 'bold',
                },
              },
            },
          },
          animation: {
            onComplete: () => {
              setTimeout(() => {
                const image = canvas.toDataURL('image/png', 1.0);
                chart.destroy();
                resolve(image);
              }, 200);
            },
          },
        },
      });
    });
  };
  const generateChartImage = async (data, title) => {
    const canvas = document.createElement('canvas');
    // Increased resolution for better quality in PDF
    canvas.width = 1000;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');

    return new Promise((resolve) => {
      const chart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: Object.keys(data),
          datasets: [
            {
              data: Object.values(data),
              backgroundColor: [
                '#3498db',
                '#2ecc71',
                '#e74c3c',
                '#f1c40f',
                '#9b59b6',
                '#1abc9c',
                '#d35400',
                '#34495e',
              ],
            },
          ],
        },
        options: {
          responsive: false,
          maintainAspectRatio: false,
          animation: {
            onComplete: () => {
              setTimeout(() => {
                // Small delay to ensure rendering
                const image = canvas.toDataURL('image/png', 1.0);
                chart.destroy();
                resolve(image);
              }, 200);
            },
          },
          plugins: {
            title: {
              display: true,
              text: title,
              font: { size: 18 },
            },
            legend: {
              position: 'right',
              labels: { font: { size: 14 } },
            },
          },
        },
      });
    });
  };
  // ✅ Agora assíncrona
  // Add this utility function at the top of your component
  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = src;
    });
  };

  const exportPDF = async () => {
    setPdfLoading(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // ===== COVER PAGE =====
      const pageWidth = doc.internal.pageSize.getWidth();
      const centerX = pageWidth / 2;

      // Try to load logo with multiple fallback options
      let logoImg;
      const logoPaths = [
        'src/assets/images/logo-aqu.6cc27101.png',
        '/logo.png',
        'logo.png',
        '/public/logo.png',
      ];

      for (const path of logoPaths) {
        try {
          logoImg = await loadImage(path);
          break; // Use first successful load
        } catch (e) {
          console.warn(`Could not load logo from ${path}`);
        }
      }

      // Add logo if loaded, otherwise use text fallback
      if (logoImg) {
        const logoWidth = 120;
        const logoHeight = 30;
        doc.addImage(logoImg, 'PNG', centerX - logoWidth / 2, 20, logoWidth, logoHeight);
      } else {
        doc.setFontSize(16);
        doc.text('Prefeitura Municipal', centerX, 40, { align: 'center' });
      }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('- SESAU -', centerX, 65, { align: 'center' });
      doc.text('SECRETARIA MUNICIPAL DE SAÚDE E SANEAMENTO', centerX, 75, { align: 'center' });
      doc.text('SETOR DE INFORMÁTICA', centerX, 85, { align: 'center' });
      // Rest of your PDF generation code remains the same...

      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Relatório de Ordens de Serviço', centerX, 150, { align: 'center' });

      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text(`Período: ${startDate} até ${endDate}`, centerX, 170, { align: 'center' });
      doc.text(`Data de geração: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, centerX, 270, {
        align: 'center',
      });

      // ===== SUMMARY PAGE =====
      doc.addPage();

      const totalOrders = orders.length;
      const statusCounts = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});

      // Summary content
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumo', 20, 20);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total de Ordens: ${totalOrders}`, 20, 30);

      Object.entries(statusCounts).forEach(([status, count], index) => {
        const translatedStatus = traduzirStatus(status);
        const percentage = ((count / totalOrders) * 100).toFixed(1);
        doc.text(`${translatedStatus}: ${count} (${percentage}%)`, 20, 40 + index * 10);
      });

      // ===== CHART =====
      try {
        const chartImage = await generateHorizontalBarChart(
          statusCounts,
          'Distribuição de Ordens por Status'
        );
        doc.addImage(chartImage, 'PNG', 15, 120, 160, 90);
      } catch (error) {
        console.error('Erro ao gerar gráfico:', error);
        doc.text('Gráfico não disponível', 15, 70);
        doc.text(error.message, 15, 80);
      }

      // ===== DETAILED TABLE =====
      doc.addPage();

      const tableColumns = [
        { header: 'Nº OS', dataKey: 'orderNumber' },
        { header: 'Título', dataKey: 'title' },
        { header: 'Status', dataKey: 'status' },
        { header: 'Técnico', dataKey: 'technician' },
        { header: 'Local', dataKey: 'establishment' },
        { header: 'Data', dataKey: 'createdAt' },
        { header: 'Solução', dataKey: 'solution' },
      ];

      const tableData = orders.map((order) => ({
        orderNumber: order.orderNumber || '-',
        title: order.title || '-',
        status: traduzirStatus(order.status) || '-', // Aqui aplicamos a tradução
        technician: order.technicianName || '-',
        establishment: order.establishmentName || '-',
        createdAt: order.createdAt?.seconds
          ? format(new Date(order.createdAt.seconds * 1000), 'dd/MM/yy HH:mm')
          : '-',
        solution: order.solution || '-',
      }));

      // Generate table
      autoTable(doc, {
        columns: tableColumns,
        body: tableData,
        startY: 25,
        margin: { top: 25 },
        styles: {
          fontSize: 9,
          cellPadding: 2,
          overflow: 'linebreak',
          minCellHeight: 5,
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontSize: 10,
          cellPadding: 3,
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240],
        },
        didDrawPage: (data) => {
          // Footer
          doc.setFontSize(10);
          doc.text(
            `Página ${data.pageNumber} de ${doc.getNumberOfPages()}`,
            data.settings.margin.left,
            doc.internal.pageSize.height - 10
          );
        },
      });

      // Save PDF
      doc.save(`relatorio-os-${startDate}_${endDate}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert(`Falha ao gerar PDF: ${error.message}`);
    } finally {
      setPdfLoading(false);
    }
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

      {/* Tabela */}
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
                  <td className="px-4 py-2 border-b">
                    {order.createdAt?.seconds
                      ? format(new Date(order.createdAt.seconds * 1000), 'dd/MM/yyyy HH:mm')
                      : '-'}
                  </td>
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
