import React, { useEffect, useState } from 'react';
import { apiService } from '../../services/api';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Clock, Building, User } from 'lucide-react';
import { getStatusText, getStatusColor, getPriorityText, getPriorityColor } from '../../types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const TechnicianDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await apiService.updateServiceOrder(id, { status, technicianNotes: notes });
      setSelectedOrder(null);
      setNotes('');
      loadOrders();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.text('Relatório de Ordens Concluídas', 14, 16);
    const tableColumn = ['OS', 'Título', 'Estabelecimento', 'Data Conclusão'];
    const tableRows = [];

    orders
      .filter((order) => order.status === 'completed')
      .forEach((order) => {
        const row = [
          order.orderNumber,
          order.title,
          order.establishmentName,
          new Date(order.updatedAt?.seconds * 1000).toLocaleDateString('pt-BR'),
        ];
        tableRows.push(row);
      });

    doc.autoTable(tableColumn, tableRows, { startY: 20 });
    doc.save('relatorio-tecnico.pdf');
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

  if (loading) return <p>Carregando ordens...</p>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4">
      <h1 className="text-3xl font-extrabold mb-6 text-gray-900">Minhas Ordens Atribuídas</h1>

      {orders.length === 0 ? (
        <p className="text-center text-gray-600">Nenhuma ordem atribuída no momento.</p>
      ) : (
        orders.map((order) => (
          <Card
            key={order.id}
            className="hover:shadow-lg transition-shadow rounded-lg border border-gray-200"
          >
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{order.title}</h3>
                  <p className="text-gray-700 mb-4">{order.description}</p>
                  <div className="flex flex-wrap gap-3 mb-4">
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusText(order.status)}
                    </Badge>
                    <Badge className={getPriorityColor(order.priority)}>
                      {getPriorityText(order.priority)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5" /> {formatDate(order.createdAt)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="w-5 h-5" /> {order.establishmentName}
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5" /> Cliente: {order.userName}
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex flex-col gap-3 w-full md:w-64">
                  {order.status === 'assigned' && (
                    <Button
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                      onClick={() => handleStatusUpdate(order.id, 'in_progress')}
                    >
                      Iniciar
                    </Button>
                  )}
                  {order.status === 'in_progress' && (
                    <>
                      <textarea
                        placeholder="Descreva o serviço executado"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="border rounded-md p-2 w-full"
                      />
                      <Button
                        className="bg-green-500 hover:bg-green-600 text-white"
                        onClick={() => handleStatusUpdate(order.id, 'completed')}
                      >
                        Finalizar
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <div className="flex justify-end mt-6">
        <Button className="bg-purple-500 hover:bg-purple-600 text-white" onClick={generatePDF}>
          Gerar Relatório PDF
        </Button>
      </div>
    </div>
  );
};

export default TechnicianDashboard;
