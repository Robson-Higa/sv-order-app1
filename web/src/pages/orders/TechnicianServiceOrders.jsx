import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Clock, Building, User, CheckCircle, XCircle, PauseCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import FinishOrderModal from './components/FinishOrderModal';
import ActionModal from './components/ActionModal';
import { toast } from 'react-toastify';
import { getStatusText } from '../../types';

import { updateServiceOrderStatus } from '@/services/api';

export const ServiceOrderStatus = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const TechnicianServiceOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await apiService.getServiceOrders({ technicianName: user.name });
      setOrders(response?.serviceOrders || []);
    } catch (error) {
      console.error('Erro ao carregar ordens:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  const handleStartOrder = async (id) => {
    try {
      // Sempre tenta se auto-atribuir — backend ignora se já for o técnico
      await apiService.assignSelfToOrder(id);

      // Depois, atualiza o status
      await apiService.updateStatus(id, { status: ServiceOrderStatus.IN_PROGRESS });

      toast.success('Atendimento iniciado!');
      await loadOrders();
    } catch (error) {
      toast.error(error?.error || 'Erro ao iniciar atendimento');
      console.error('Erro ao iniciar atendimento:', error);
      alert('Não foi possível iniciar a ordem.');
    }
  };

  const handleFinishOrder = async (id, { startTime, endTime, description }) => {
    try {
      await apiService.updateStatus(id, {
        status: 'completed',
        technicianNotes: description,
        startTime: new Date(),
        endTime: new Date(),
      });

      // Gerar PDF
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Relatório de Atendimento', 10, 10);
      doc.setFontSize(12);
      doc.text(`OS: ${selectedOrder.orderNumber}`, 10, 20);
      doc.text(`Título: ${selectedOrder.title}`, 10, 30);
      doc.text(`Descrição: ${selectedOrder.description}`, 10, 40);
      doc.text(`Cliente: ${selectedOrder.userName}`, 10, 50);
      doc.text(`Estabelecimento: ${selectedOrder.establishmentName}`, 10, 60);
      doc.text(`Início: ${new Date(startTime).toLocaleString()}`, 10, 70);
      doc.text(`Fim: ${new Date(endTime).toLocaleString()}`, 10, 80);
      doc.text('Descrição do serviço:', 10, 90);
      doc.text(description, 10, 100);
      doc.save(`Relatorio_${selectedOrder.orderNumber}.pdf`);

      setShowFinishModal(false);
      setSelectedOrder(null);
      await loadOrders();
    } catch (error) {
      console.error('Erro ao finalizar ordem:', error);
      alert('Não foi possível finalizar a ordem.');
    }
  };

  const handleActionConfirm = async (action, reason) => {
    try {
      let status = '';
      let updateData = {};

      if (action === 'cancel') {
        status = 'cancelled';
        updateData = { cancellationReason: reason };
      }
      if (action === 'pause') {
        // Seu backend não tem PAUSED no enum, precisa validar isso ou ajustar backend
        status = 'in_progress'; // ou criar um status PAUSED no backend se quiser
        // Para exemplo, vamos só usar in_progress e ignorar o pause
        alert('Status "pausar" não está implementado no backend');
        return;
      }

      await apiService.updateStatus(selectedOrder.id, status, updateData);
      setShowActionModal(false);
      setSelectedOrder(null);
      setCurrentAction(null);
      await loadOrders();
    } catch (error) {
      console.error(`Erro ao executar ação ${action}:`, error);
      alert('Não foi possível realizar a ação.');
    }
  };

  const handleGeneratePDF = (order) => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Relatório de Atendimento', 10, 10);
      doc.setFontSize(12);
      doc.text(`OS: ${order.orderNumber || '-'}`, 10, 20);
      doc.text(`Título: ${order.title || '-'}`, 10, 30);
      doc.text(`Descrição: ${order.description || '-'}`, 10, 40);
      doc.text(`Cliente: ${order.userName || '-'}`, 10, 50);
      doc.text(`Estabelecimento: ${order.establishmentName || '-'}`, 10, 60);
      doc.text(`Setor: ${order.sectorName || '-'}`, 10, 70);
      doc.text(`Criada: ${formatDate(order.createdAt)}`, 10, 80);

      if (order.startTime) {
        doc.text(`Início: ${formatDate(order.startTime)}`, 10, 90);
      }
      if (order.endTime) {
        doc.text(`Fim: ${formatDate(order.endTime)}`, 10, 100);
      }

      if (order.technicianNotes) {
        doc.text('Descrição do serviço:', 10, 110);
        doc.text(order.technicianNotes, 10, 120);
      }

      doc.save(`Relatorio_${order.orderNumber || order.id}.pdf`);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF');
    }
  };

  // ✅ Corrige Firestore Timestamp
  const formatDate = (dateValue) => {
    if (!dateValue) return 'Data indisponível';
    let date;

    if (dateValue._seconds) {
      date = new Date(dateValue._seconds * 1000);
    } else if (typeof dateValue.toDate === 'function') {
      date = dateValue.toDate();
    } else {
      date = new Date(dateValue);
    }

    if (isNaN(date.getTime())) return 'Data inválida';

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Ordens de Serviço</h1>
        <Button onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </div>

      {/* Lista de ordens */}
      {orders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-gray-500">
            Nenhuma ordem atribuída a você.
          </CardContent>
        </Card>
      ) : (
        orders.map((order) => (
          <Card key={order.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{order.title}</h3>
                  <p className="text-gray-600">{order.description}</p>
                </div>
                <Badge className="bg-blue-500 text-white">{getStatusText(order.status)}</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-400" /> Criada: {formatDate(order.createdAt)}
                </div>
                {order.establishmentName && (
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    {order.establishmentName}
                  </div>
                )}
                {order.sectorName && (
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Setor: {order.sectorName}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Solicitante: {order.userName || 'N/A'}
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-2 mt-4 flex-wrap">
                {/* Botão para gerar PDF a qualquer momento */}
                <Button className="bg-gray-600 text-white" onClick={() => handleGeneratePDF(order)}>
                  📄 Baixar PDF
                </Button>
                {order.status?.toUpperCase() === 'OPEN' && (
                  <>
                    <Button
                      className="bg-blue-600 text-white"
                      onClick={() => handleStartOrder(order.id)}
                    >
                      Iniciar Atendimento
                    </Button>
                    <Button
                      className="bg-red-600 text-white flex items-center gap-2"
                      onClick={() => {
                        setSelectedOrder(order);
                        setCurrentAction('cancel');
                        setShowActionModal(true);
                      }}
                    >
                      <XCircle className="w-4 h-4" /> Cancelar
                    </Button>
                  </>
                )}

                {order.status?.toUpperCase() === 'IN_PROGRESS' && (
                  <>
                    <Button
                      className="bg-green-600 text-white"
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowFinishModal(true);
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Finalizar Ordem
                    </Button>
                    <Button
                      className="bg-yellow-500 text-white flex items-center gap-2"
                      onClick={() => {
                        setSelectedOrder(order);
                        setCurrentAction('pause');
                        setShowActionModal(true);
                      }}
                    >
                      <PauseCircle className="w-4 h-4" /> Pausar
                    </Button>
                    <Button
                      className="bg-red-600 text-white flex items-center gap-2"
                      onClick={() => {
                        setSelectedOrder(order);
                        setCurrentAction('cancel');
                        setShowActionModal(true);
                      }}
                    >
                      <XCircle className="w-4 h-4" /> Cancelar
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Modal Finalizar */}
      {showFinishModal && (
        <FinishOrderModal
          order={selectedOrder}
          onClose={() => setShowFinishModal(false)}
          onConfirm={(data) => handleFinishOrder(selectedOrder.id, data)}
        />
      )}

      {/* Modal Cancelar / Pausar */}
      {showActionModal && (
        <ActionModal
          action={currentAction}
          onClose={() => {
            setShowActionModal(false);
            setCurrentAction(null);
          }}
          onConfirm={handleActionConfirm}
        />
      )}
    </div>
  );
};

export default TechnicianServiceOrders;
