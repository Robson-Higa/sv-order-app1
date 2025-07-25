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
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
      const response = await apiService.getServiceOrderById(id);
      if (response.order) {
        setOrder(response.order);
        // Pre-fill technician notes if they exist
        if (response.order.technicianNotes) {
          setTechnicianNotes(response.order.technicianNotes);
        }
        // Check if the order is completed by technician and needs user confirmation
        if (
          user?.userType === UserType.END_USER &&
          response.order.status === 'completed' &&
          !response.order.confirmedAt
        ) {
          setShowConfirmationAlert(true);
        }
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
      await apiService.updateServiceOrder(id, {
        status: 'completed',
        technicianNotes: technicianNotes.trim(),
        completedAt: new Date().toISOString(),
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
            Criado por: {order.userName} em{' '}
            {format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="font-semibold">Descrição:</Label>
            <p className="text-gray-700">{order.description}</p>
          </div>
          <div>
            <Label className="font-semibold">Status:</Label>
            <span
              className={`ml-2 px-2 py-1 rounded-full text-sm font-medium ${order.status === 'confirmed' ? 'bg-green-100 text-green-800' : order.status === 'completed' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}`}
            >
              {getStatusText(order.status)}
            </span>
          </div>
          <div>
            <Label className="font-semibold">Prioridade:</Label>
            <span
              className={`ml-2 px-2 py-1 rounded-full text-sm font-medium ${order.priority === 'urgent' ? 'bg-red-100 text-red-800' : order.priority === 'high' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}`}
            >
              {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}
            </span>
          </div>
          <div>
            <Label className="font-semibold">Estabelecimento:</Label>
            <p className="text-gray-700">{order.establishmentName}</p>
          </div>
          {order.technicianName && (
            <div>
              <Label className="font-semibold">Técnico Atribuído:</Label>
              <p className="text-gray-700">{order.technicianName}</p>
            </div>
          )}
          {order.completedAt && (
            <div>
              <Label className="font-semibold">Concluído pelo Técnico em:</Label>
              <p className="text-gray-700">
                {format(new Date(order.completedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </p>
            </div>
          )}
          {order.confirmedAt && (
            <div>
              <Label className="font-semibold">Confirmado pelo Usuário em:</Label>
              <p className="text-gray-700">
                {format(new Date(order.confirmedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </p>
            </div>
          )}

          {/* Seção para Técnico: Descrever Serviço e Concluir */}
          {isTechnician && order.status !== 'confirmed' && (
            <Card className="mt-6 bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle>Ações do Técnico</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="technicianNotes" className="font-semibold">
                    Descrever Serviço Prestado:
                  </Label>
                  <Textarea
                    id="technicianNotes"
                    value={technicianNotes}
                    onChange={(e) => setTechnicianNotes(e.target.value)}
                    placeholder="Descreva o que foi feito para resolver o problema..."
                    rows={4}
                    className="mt-1"
                    disabled={order.status === 'completed' || order.status === 'confirmed'}
                  />
                </div>
                {canTechnicianComplete && (
                  <Button
                    onClick={handleTechnicianCompleteService}
                    disabled={loading || !technicianNotes.trim()}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Concluir Serviço
                  </Button>
                )}
                {order.status === 'completed' && !order.confirmedAt && (
                  <Alert className="bg-yellow-100 border-yellow-400 text-yellow-900">
                    <AlertDescription>Aguardando confirmação do usuário final.</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Seção para Usuário Final: Feedback e Confirmação */}
          {isEndUser && order.status === 'completed' && !order.confirmedAt && (
            <Card className="mt-6 bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle>Confirmação e Feedback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="feedbackText" className="font-semibold">
                    Seu Feedback:
                  </Label>
                  <Textarea
                    id="feedbackText"
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Descreva sua experiência com o serviço..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="font-semibold">Sua Avaliação:</Label>
                  <div className="flex mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-6 h-6 cursor-pointer ${star <= userRating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`}
                        onClick={() => setUserRating(star)}
                      />
                    ))}
                  </div>
                </div>
                <Button onClick={handleUserConfirmCompletion} disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Confirmar Conclusão
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Exibir Feedback e Avaliação se já confirmados */}
          {order.confirmedAt && (order.feedback || order.userRating > 0) && (
            <Card className="mt-6 bg-gray-50 border-gray-200">
              <CardHeader>
                <CardTitle>Feedback do Usuário</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {order.feedback && (
                  <div>
                    <Label className="font-semibold">Comentário:</Label>
                    <p className="text-gray-700">{order.feedback}</p>
                  </div>
                )}
                {order.userRating > 0 && (
                  <div>
                    <Label className="font-semibold">Avaliação:</Label>
                    <div className="flex mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${star <= order.userRating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-400'}`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceOrderDetailsPage;
