import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { useTechnicianStats } from '../../hooks/useTechnicianStats';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Clock, Building, User } from 'lucide-react';
import { getStatusText, getStatusColor, getPriorityText, getPriorityColor } from '../../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const TechnicianDashboard = () => {
  const { user } = useAuth();
  const { stats, monthlyData, loading, reload } = useTechnicianStats(user?.uid);

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [notes, setNotes] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoadingOrders(true);
        const response = await apiService.getServiceOrders({ scope: 'mine', limit: 20 });
        if (response?.serviceOrders) {
          setOrders(
            response.serviceOrders.filter((order) =>
              ['assigned', 'in_progress'].includes(order.status)
            )
          );
        }
      } catch (error) {
        console.error('Erro ao carregar ordens:', error);
        setOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    }
    loadOrders();
  }, []);
  async function loadMonthlyStats() {
    try {
      const res = await apiService.getMonthlyServiceOrderStats({
        establishmentId: user.establishmentId,
      });
      setMonthlyData(res.monthlyData || []);
    } catch (err) {
      console.error('Erro ao carregar estatísticas mensais:', err);
    }
  }

  const handleStatusUpdate = async (id, status) => {
    try {
      await apiService.updateServiceOrder(id, { status, technicianNotes: notes });
      setSelectedOrder(null);
      setNotes('');
      loadOrders();
      reload();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const generatePDF = async () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Título centralizado
      doc.setFontSize(18);
      doc.text('Relatório de Ordens Concluídas', pageWidth / 2, 20, { align: 'center' });

      // Data de geração
      doc.setFontSize(12);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, 30, {
        align: 'center',
      });

      // Função para carregar a imagem como Promise
      const loadImage = (src) => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = (e) => reject(e);
          img.src = src;
        });
      };

      // Adicionar logo na capa
      try {
        const logoImg = await loadImage('/src/assets/images/logo-aqu.6cc27101.png');
        const imgWidth = 60;
        const imgHeight = 60;
        doc.addImage(logoImg, 'PNG', pageWidth / 2 - imgWidth / 2, 40, imgWidth, imgHeight);
      } catch (logoError) {
        console.error('Erro ao carregar a logo:', logoError);
        // Continua sem a logo
      }

      // Informações do técnico
      doc.setFontSize(14);
      doc.text(`Técnico: ${user?.name || 'Não informado'}`, 14, 110);

      // Tabela de ordens
      const tableColumn = ['OS', 'Título', 'Estabelecimento', 'Data Conclusão'];
      const tableRows = [];

      orders
        .filter((order) => order.status.toLowerCase() === 'completed')
        .forEach((order) => {
          const updatedAtDate = order.updatedAt?.seconds
            ? new Date(order.updatedAt.seconds * 1000)
            : new Date(order.updatedAt);
          const row = [
            order.orderNumber,
            order.title,
            order.establishmentName,
            updatedAtDate.toLocaleDateString('pt-BR'),
          ];
          tableRows.push(row);
        });

      doc.autoTable(tableColumn, tableRows, {
        startY: 120,
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
        didDrawPage: (data) => {
          // Footer com número de página
          const pageCount = doc.getNumberOfPages();
          doc.setFontSize(10);
          doc.text(
            `Página ${data.pageNumber} de ${pageCount}`,
            data.settings.margin.left,
            doc.internal.pageSize.height - 10
          );
        },
      });

      doc.save(`relatorio-tecnico-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Verifique o console para mais detalhes.');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Data inválida';
    const d = date?.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loadingOrders) return <p>Carregando ordens...</p>;

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold">Bem-vindo, {user?.name}</h1>

      {/* Cards de Totais */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-blue-100 p-4 rounded shadow text-center">
            <p className="text-lg font-bold text-blue-700">{stats.assigned || 0}</p>
            <p className="text-sm text-blue-600">Atribuídas</p>
          </div>
          <div className="bg-yellow-100 p-4 rounded shadow text-center">
            <p className="text-lg font-bold text-yellow-700">{stats.in_progress || 0}</p>
            <p className="text-sm text-yellow-600">Em Andamento</p>
          </div>
          <div className="bg-green-100 p-4 rounded shadow text-center">
            <p className="text-lg font-bold text-green-700">{stats.completed || 0}</p>
            <p className="text-sm text-green-600">Concluídas</p>
          </div>
        </div>
      )}

      {/* Gráfico */}
      <div className="bg-white rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Evolução das Ordens (Últimos 12 meses)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <XAxis dataKey="month" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar
              type="monotone"
              dataKey="assigned"
              name="Atribuídas"
              stroke="#3B82F6"
              strokeWidth={2}
            />
            <Bar
              type="monotone"
              dataKey="in_progress"
              name="Em Andamento"
              stroke="#F59E0B"
              strokeWidth={2}
            />
            <Bar
              type="monotone"
              dataKey="completed"
              name="Concluídas"
              stroke="#10B981"
              strokeWidth={2}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Lista de ordens (a implementar conforme seu código anterior) */}
    </div>
  );
};

export default TechnicianDashboard;
