import React, { useState } from 'react';
import { apiService } from '@/services/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getUserRating } from '@/utils/ratingUtils';
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
      console.log('orders response sample:', response.orders && response.orders[0]);
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
      in_progress: 'Em Andamento',
      completed: 'Concluído',
      closed: 'Fechado',
      cancelled: 'Cancelado',
      canceled: 'Cancelado',
      resolved: 'Resolvido',
      reopened: 'Reaberto',
      paused: 'Pausado',
      reactivated: 'Reativado',
      assigned: 'Atribuído',
      confirmed: 'Confirmado',
      PAUSED: 'Pausado',
      IN_PROGRESS: 'Em Andamento',
      COMPLETED: 'Concluído',
      CANCELLED: 'Cancelado',
      CONFIRMED: 'Confirmado',
      REACTIVATED: 'Reativado',
      ASSIGNED: 'Atribuído',
      OPEN: 'Aberto',
      OPENED: 'Aberto',
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

  const getPriorityText = (priority) => {
    const map = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
    };
    return map[priority] || priority;
  };

  const exportPDF = async () => {
    setPdfLoading(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      const centerX = pageWidth / 2;

      // Função para formatar datas
      const formatDate = (dateValue) => {
        if (!dateValue) return '-';
        if (dateValue.seconds) {
          return new Date(dateValue.seconds * 1000).toLocaleString('pt-BR');
        }
        return new Date(dateValue).toLocaleString('pt-BR');
      };

      const getPriorityText = (priority) => {
        const map = { low: 'Baixa', medium: 'Média', high: 'Alta' };
        return map[priority] || priority;
      };

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
        const logoWidth = 80;
        const logoHeight = 25;
        doc.addImage(logoImg, 'PNG', centerX - logoWidth / 2, 20, logoWidth, logoHeight);
      } else {
        doc.setFontSize(16);
        doc.text('Prefeitura Municipal', centerX, 40, { align: 'left' });
      }
      //doc.setFont('helvetica', 'bold');
      //doc.setFontSize(18);
      //doc.text('Prefeitura Municipal', centerX, 40, { align: 'center' });
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SESAU', centerX, 50, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('SECRETARIA MUNICIPAL DE SAÚDE E SANEAMENTO', centerX, 55, { align: 'center' });
      doc.text('Setor de Informática', centerX, 60, { align: 'center' });

      doc.setFontSize(22);
      doc.text('Relatório de Ordens de Serviço', centerX, 130, { align: 'center' });

      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.text(`Período: ${startDate} até ${endDate}`, centerX, 150, { align: 'center' });
      doc.text(`Data de geração: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, centerX, 270, {
        align: 'center',
      });

      // ==== RESUMO ====
      doc.addPage();
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumo', margin, 20);

      const totalOrders = orders.length;
      const statusCounts = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total de Ordens: ${totalOrders}`, margin, 30);

      let ySummary = 40;
      Object.entries(statusCounts).forEach(([status, count]) => {
        const translatedStatus = traduzirStatus(status);
        const percentage = ((count / totalOrders) * 100).toFixed(1);
        doc.text(`${translatedStatus}: ${count} (${percentage}%)`, margin, ySummary);
        ySummary += 8;
      });

      try {
        const chartImage = await generateHorizontalBarChart(
          statusCounts,
          'Distribuição de Ordens por Status'
        );
        doc.addImage(chartImage, 'PNG', margin, ySummary + 10, 180, 90);
      } catch (err) {
        doc.text('Gráfico não disponível.', margin, ySummary + 10);
      }

      // ==== DETALHES EM CARDS ====
      doc.addPage();
      doc.setFontSize(18);
      doc.text('Detalhes das Ordens', margin, 20);

      let y = 35;

      orders.forEach((order) => {
        // Calcular altura necessária
        let baseHeight = 40; // espaço mínimo para cabeçalho e campos fixos
        let solutionHeight = 0;
        let feedbackHeight = 0;
        let technicianNotesHeight = 0;
        let userFeedbackHeight = 0;

        if (order.solution) {
          const solutionText = doc.splitTextToSize(`Solução: ${order.solution}`, 175);
          solutionHeight = solutionText.length * 5;
        }

        if (order.feedback) {
          const feedbackText = doc.splitTextToSize(`Feedback: ${order.feedback}`, 175);
          feedbackHeight = feedbackText.length * 5;
        }

        if (order.technicianNotes) {
          const technicianNotesText = doc.splitTextToSize(
            `Notas Técnico: ${order.technicianNotes}`,
            175
          );
          technicianNotesHeight = technicianNotesText.length * 5;
        }

        if (order.userFeedback) {
          const userFeedbackText = doc.splitTextToSize(
            `Feedback do Usuário: ${order.userFeedback}`,
            175
          );
          userFeedbackHeight = userFeedbackText.length * 5;
        }

        let cardHeight =
          baseHeight +
          solutionHeight +
          feedbackHeight +
          technicianNotesHeight +
          userFeedbackHeight +
          20; // margem extra

        // Verificar se cabe na página
        if (y + cardHeight > 280) {
          doc.addPage();
          y = 20;
        }

        // Desenhar card com altura dinâmica
        doc.setDrawColor(200);
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(margin, y, 182, cardHeight, 3, 3, 'FD');

        let textY = y + 8;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(`Nº OS: ${order.orderNumber || '-'}`, margin + 4, textY);
        textY += 6;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Título: ${order.title || '-'}`, margin + 4, textY);
        textY += 6;

        doc.text(
          `Status: ${traduzirStatus(order.status)} | Prioridade: ${getPriorityText(order.priority)}`,
          margin + 4,
          textY
        );
        textY += 6;

        doc.text(
          `Estabelecimento: ${order.establishmentName || '-'} | Setor: ${order.sector || '-'}`,
          margin + 4,
          textY
        );
        textY += 6;

        doc.text(`Técnico: ${order.technicianName || '-'}`, margin + 4, textY);
        textY += 6;

        doc.text(
          `Datas: Criada ${formatDate(order.createdAt)} | Atualização ${formatDate(order.updatedAt)}`,
          margin + 4,
          textY
        );
        textY += 6;

        doc.text(
          `Finalizada: ${order.completedAt ? formatDate(order.completedAt) : '-'}`,
          margin + 4,
          textY
        );
        textY += 6;

        if (order.pauseReason) {
          doc.text(`Motivo Pausa: ${order.pauseReason}`, margin + 4, textY);
          textY += 6;
        }

        if (order.cancelReason) {
          doc.text(`Motivo Cancelamento: ${order.cancelReason}`, margin + 4, textY);
          textY += 6;
        }

        if (order.solution) {
          const solutionText = doc.splitTextToSize(`Solução: ${order.solution}`, 175);
          doc.text(solutionText, margin + 4, textY);
          textY += solutionText.length * 5;
        }

        if (order.feedback) {
          const feedbackText = doc.splitTextToSize(`Feedback: ${order.feedback}`, 175);
          doc.text(feedbackText, margin + 4, textY);
          textY += feedbackText.length * 5;
        }

        if (order.technicianNotes) {
          const technicianNotesText = doc.splitTextToSize(
            `Notas Técnico: ${order.technicianNotes}`,
            175
          );
          doc.text(technicianNotesText, margin + 4, textY);
          textY += technicianNotesText.length * 5;
        }

        if (order.userFeedback) {
          const userFeedbackText = doc.splitTextToSize(
            `Feedback do Usuário: ${order.userFeedback}`,
            175
          );
          doc.text(userFeedbackText, margin + 4, textY);
          textY += userFeedbackText.length * 5;
        }

        if (order.userRating !== undefined && order.userRating !== null) {
          doc.text(`Avaliação do Usuário: ${order.userRating}`, margin + 4, textY);
          textY += 6;
        }

        y = textY + 8;
      });

      // Rodapé
      const pageCount = doc.getNumberOfPages();
      for (let i = 2; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, 290, { align: 'right' });
      }

      doc.save(`relatorio-os-${startDate}_${endDate}.pdf`);
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert(`Falha ao gerar PDF: ${error.message}`);
    } finally {
      setPdfLoading(false);
    }
  };

  const parseDate = (dateValue) => {
    if (!dateValue) return null;

    if (dateValue.seconds) {
      return new Date(dateValue.seconds * 1000);
    }

    if (typeof dateValue.toDate === 'function') {
      return dateValue.toDate();
    }

    const d = new Date(dateValue);
    return isNaN(d.getTime()) ? null : d;
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
                <th className="px-4 py-2 text-left border-b">Prioridade</th> {/* novo */}
                <th className="px-4 py-2 text-left border-b">Técnico</th>
                <th className="px-4 py-2 text-left border-b">Solução do Técnico</th> {/* novo */}
                <th className="px-4 py-2 text-left border-b">Estabelecimento</th>
                <th className="px-4 py-2 text-left border-b">Setor</th> {/* novo */}
                <th className="px-4 py-2 text-left border-b">Usuário</th> {/* novo */}
                <th className="px-4 py-2 text-left border-b">Criado em</th>
                <th className="px-4 py-2 text-left border-b">Agendado</th> {/* novo */}
                <th className="px-4 py-2 text-left border-b">Início</th> {/* novo */}
                <th className="px-4 py-2 text-left border-b">Fim</th> {/* novo */}
                <th className="px-4 py-2 text-left border-b">Concluído em</th> {/* novo */}
                <th className="px-4 py-2 text-left border-b">Feedback do Usuário</th> {/* novo */}
                <th className="px-4 py-2 text-left border-b">Nota do Usuário</th> {/* novo */}
                <th className="px-4 py-2 text-left border-b">Confirmação do Usuário</th>{' '}
                {/* novo */}
                <th className="px-4 py-2 text-left border-b">Cancelamento</th>
                <th className="px-4 py-2 text-left border-b">Pausado</th>
                <th className="px-4 py-2 text-left border-b">Atualizado em</th> {/* novo */}
              </tr>
            </thead>

            <tbody>
              {orders.map((order, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border-b">{order.orderNumber}</td>
                  <td className="px-4 py-2 border-b">{order.title}</td>
                  <td className="px-4 py-2 border-b">{traduzirStatus(order.status)}</td>
                  <td className="px-4 py-2 border-b">{getPriorityText(order.priority) || ' - '}</td>
                  <td className="px-4 py-2 border-b">{order.technicianName || '-'}</td>
                  <td className="px-4 py-2 border-b">{order.technicianNotes || '-'}</td>
                  <td className="px-4 py-2 border-b">{order.establishmentName || '-'}</td>
                  <td className="px-4 py-2 border-b">{order.sector || '-'}</td>
                  <td className="px-4 py-2 border-b">{order.userName || '-'}</td>

                  <td className="px-4 py-2 border-b">
                    {(() => {
                      const dateObj = parseDate(order.createdAt);
                      return dateObj ? format(dateObj, 'dd/MM/yyyy HH:mm') : '-';
                    })()}
                  </td>

                  <td className="px-4 py-2 border-b">
                    {(() => {
                      const dateObj = parseDate(order.scheduledAt);
                      return dateObj ? format(dateObj, 'dd/MM/yyyy HH:mm') : '-';
                    })()}
                  </td>

                  <td className="px-4 py-2 border-b">
                    {(() => {
                      const dateObj = parseDate(order.startTime);
                      return dateObj ? format(dateObj, 'dd/MM/yyyy HH:mm') : '-';
                    })()}
                  </td>

                  <td className="px-4 py-2 border-b">
                    {(() => {
                      const dateObj = parseDate(order.endTime);
                      return dateObj ? format(dateObj, 'dd/MM/yyyy HH:mm') : '-';
                    })()}
                  </td>

                  <td className="px-4 py-2 border-b">
                    {(() => {
                      const dateObj = parseDate(order.completedAt);
                      return dateObj ? format(dateObj, 'dd/MM/yyyy HH:mm') : '-';
                    })()}
                  </td>

                  <td className="px-4 py-2 border-b">{order.userFeedback || '-'}</td>
                  <td className="px-4 py-2 border-b">{getUserRating(order)}</td>
                  <td className="px-4 py-2 border-b">{order.userConfirmed ? 'Sim' : 'Não'}</td>
                  <td className="px-4 py-2 border-b">{order.cancelReason || '-'}</td>
                  <td className="px-4 py-2 border-b">{order.pauseReason || '-'}</td>

                  <td className="px-4 py-2 border-b">
                    {(() => {
                      const dateObj = parseDate(order.updatedAt);
                      return dateObj ? format(dateObj, 'dd/MM/yyyy HH:mm') : '-';
                    })()}
                  </td>
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
