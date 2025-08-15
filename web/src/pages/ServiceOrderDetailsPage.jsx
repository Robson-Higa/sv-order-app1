import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { UserType } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Loader2, CheckCircle, XCircle, MessageSquare, Star } from 'lucide-react';
import { parseAtendentDate } from '../utils/dateAtendentUtils';
import { getPriorityText } from '@/types/index';
import { formatDate } from '@/utils/dateUtils'; // se estiver em outro arquivo
import '../App.css';

const ServiceOrderDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [technicianNotes, setTechnicianNotes] = useState('');
  const [showConfirmationAlert, setShowConfirmationAlert] = useState(false);

  useEffect(() => {
    if (id) {
      loadOrderDetails();
    }
  }, [id]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.getServiceOrder(id);
      console.log('Campos importantes:', {
        technicianNotes: response?.serviceOrder?.technicianNotes,
        completedAt: response?.serviceOrder?.completedAt,
        feedback: response?.serviceOrder?.userFeedback,
        userRating: response?.serviceOrder?.userRating,
        confirmedAt: response?.serviceOrder?.confirmedAt,
        setor: response?.serviceOrder?.sector,
      });

      if (response?.serviceOrder) {
        const orderData = response.serviceOrder;
        setOrder(orderData);

        if (orderData.technicianNotes) {
          setTechnicianNotes(orderData.technicianNotes);
        }

        if (
          user?.userType === UserType.END_USER &&
          orderData.status === 'COMPLETED' &&
          !orderData.confirmedAt
        ) {
          setShowConfirmationAlert(true);
        }
      } else {
        setError('Ordem de serviço não encontrada.');
      }
    } catch (err) {
      setError(err.message || 'Erro ao carregar detalhes da ordem de serviço.');
      console.error('Error loading order details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTechnicianCompleteService = async () => {
    if (!technicianNotes.trim()) {
      setError('Por favor, descreva o serviço prestado antes de concluir.');
      return;
    }
    if (!window.confirm('Tem certeza que deseja concluir este serviço?')) {
      return;
    }

    setLoading(true);
    try {
      await apiService.updateStatus(id, {
        status: 'completed',
        technicianNotes: 'Resolvido com sucesso',
        startTime: new Date(),
        endTime: new Date(),
      });

      await loadOrderDetails(); // Reload to update status and show confirmation alert
      setError('');
      alert('Serviço concluído pelo técnico! O usuário final será notificado para confirmar.');
    } catch (err) {
      setError(err.message || 'Erro ao concluir serviço.');
      console.error('Error completing service:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserConfirmCompletion = async () => {
    if (!window.confirm('Confirma que o serviço foi prestado e concluído?')) {
      return;
    }

    setLoading(true);
    try {
      await apiService.updateServiceOrder(id, {
        status: 'confirmed',
        feedback: feedbackText.trim(),
        userRating: userRating,
        confirmedAt: new Date().toISOString(),
      });
      await loadOrderDetails();
      setError('');
      setShowConfirmationAlert(false);
      alert('Serviço confirmado com sucesso! Obrigado pelo seu feedback.');
    } catch (err) {
      setError(err.message || 'Erro ao confirmar conclusão do serviço.');
      console.error('Error confirming service completion:', err);
    } finally {
      setLoading(false);
    }
  };

  const createdAtDate = formatDate(order?.createdAt);
  const startedAtDate = formatDate(order?.startTime);
  const completedAtDate = formatDate(order?.completedAt);
  const confirmedAtDate = formatDate(order?.confirmedAt);
  const cancellationDate = order?.cancellationReason?.createdAt
    ? formatDate(order.cancellationReason.createdAt)
    : '-';
  const pauseDate = order?.updatedAt ? formatDate(order.updatedAt) : '-';
  const AttendanceTime =
    order?.startTime && order?.completedAt
      ? parseAtendentDate(order.startTime, order.completedAt)
      : 'Tempo não disponível';
  console.log('order.createdAt:', order?.createdAt);
  console.log('started:', startedAtDate);
  console.log('completed:', completedAtDate);
  console.log('Tempo de Atendimento:', AttendanceTime);

  const getStatusText = (status) => {
    switch (status) {
      case 'open':
        return 'Aberta';
      case 'assigned':
        return 'Atribuída';
      case 'in_progress':
        return 'Em Andamento';
      case 'completed':
        return 'Concluída (Aguardando Confirmação)';
      case 'confirmed':
        return 'Confirmada';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="ml-2 text-gray-700">Carregando detalhes da ordem...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!order) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Ordem de serviço não encontrada.</AlertDescription>
      </Alert>
    );
  }

  const isTechnician = user?.userType === UserType.TECHNICIAN;
  const isEndUser = user?.userType === UserType.END_USER;
  const isAdmin = user?.userType === UserType.ADMIN;

  const canTechnicianComplete = isTechnician && order.status === 'in_progress';
  const canUserConfirm = isEndUser && order.status === 'completed' && !order.confirmedAt;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Detalhes da Ordem de Serviço</h1>
        <Button onClick={() => navigate(-1)} variant="outline">
          Voltar
        </Button>
      </div>

      {showConfirmationAlert && canUserConfirm && (
        <Alert className="bg-yellow-50 border-yellow-300 text-yellow-800">
          <MessageSquare className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              O serviço foi concluído pelo técnico. Por favor, confirme a conclusão e deixe seu
              feedback.
            </span>
            <Button onClick={() => setShowConfirmationAlert(false)} variant="ghost" size="sm">
              <XCircle className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{order.title}</CardTitle>
          <p className="text-sm text-gray-500">
            Criado por: {order.userName} em {createdAtDate}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 mt-4">
            {order?.title && (
              <p>
                <strong>Título:</strong> {order.title}
              </p>
            )}
            {order?.description && (
              <p>
                <strong>Descrição:</strong> {order.description}
              </p>
            )}
            {order?.establishment?.name && (
              <p>
                <strong>Estabelecimento:</strong> {order.establishment.name}
                <strong> Setor: </strong> {order.sector || 'N/A'}
              </p>
            )}
            {order?.startTime && (
              <p>
                <strong>Data de Abertura:</strong> {startedAtDate}
              </p>
            )}
            {order?.completedAt && (
              <p>
                <strong>Data de Finalização:</strong> {completedAtDate}
              </p>
            )}
            {order?.startTime && order?.completedAt && (
              <p>
                <strong>Tempo de Atendimento:</strong> {AttendanceTime}
              </p>
            )}

            {order.status?.toLowerCase() === 'cancelled' && order?.cancellationReason?.reason && (
              <div className="mb-4">
                <p>
                  <strong>Motivo do cancelamento:</strong>{' '}
                  <span className="text-red-700">{order.cancellationReason.reason}</span>
                </p>

                {order?.cancellationReason?.createdAt && (
                  <p>
                    <strong>Cancelado em: </strong>
                    {cancellationDate}
                  </p>
                )}
              </div>
            )}

            {order?.priority && (
              <p>
                <strong>Prioridade:</strong> {getPriorityText(order.priority)}
              </p>
            )}

            {order?.technicianNotes && (
              <p>
                <strong>Serviço Executado:</strong> {order.technicianNotes}
              </p>
            )}

            {order?.userFeedback && (
              <p>
                <strong>Feedback do Usuário:</strong> {order.userFeedback}
              </p>
            )}

            {order.status?.toLowerCase() === 'paused' && order?.pauseReason && (
              <div className="mb-4">
                <Label className="inline-block mr-2">Motivo da pausa:</Label>
                <span className="text-sm text-yellow-700">{order.pauseReason}</span>
                {order?.pausedBy?.name && (
                  <p className="text-xs text-gray-500 mt-1">
                    Pausado por: {order.pausedBy.name} {order?.updatedAt && `em ${pauseDate}`}
                  </p>
                )}
              </div>
            )}

            {order?.technicianName && (
              <p>
                <strong>Técnico Atribuído:</strong> {order.technicianName}
              </p>
            )}

            {order?.completedAt && (
              <p>
                <strong>Concluído pelo Técnico em:</strong> {completedAtDate}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceOrderDetailsPage;
