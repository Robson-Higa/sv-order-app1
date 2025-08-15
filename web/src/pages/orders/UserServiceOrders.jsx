import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Clock, Building, User } from 'lucide-react';
import { getStatusText, getPriorityText } from '../../types';
import { db } from '../../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const gradientStatusColors = {
  open: 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white',
  in_progress: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white',
  completed: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white',
  cancelled: 'bg-gradient-to-r from-red-500 to-pink-600 text-white',
  finalizado: 'bg-gradient-to-r from-gray-500 to-gray-700 text-white',
};

const gradientPriorityColors = {
  HIGH: 'bg-gradient-to-r from-red-400 to-red-600 text-white',
  MEDIUM: 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white',
  LOW: 'bg-gradient-to-r from-green-400 to-teal-500 text-white',
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

const UserServiceOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [rating, setRating] = useState(0); // Novo estado para avaliação

  // Novo estado para feedback
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await apiService.getServiceOrders({ scope: 'mine', limit: 10 });
      if (response?.serviceOrders) {
        const processedOrders = response.serviceOrders.map((order) => {
          let timestamp = 0;
          if (order.createdAt?._seconds) {
            timestamp = order.createdAt._seconds * 1000;
          } else if (typeof order.createdAt === 'string' || order.createdAt instanceof Date) {
            timestamp = new Date(order.createdAt).getTime();
          }
          return { ...order, createdAtMs: timestamp };
        });

        const sortedOrders = processedOrders.sort((a, b) => b.createdAtMs - a.createdAtMs);
        setOrders(sortedOrders);
      }
    } catch (error) {
      console.error('Erro ao carregar ordens:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) return alert('Informe um motivo para cancelamento.');
    try {
      await apiService.cancelServiceOrder(selectedOrderId, cancelReason);
      setCancelModalOpen(false);
      setCancelReason('');
      loadOrders();
    } catch (error) {
      console.error('Erro ao cancelar ordem:', error);
    }
  };

  async function handleConfirmService(orderId, feedback, rating) {
    const trimmedFeedback = feedback.trim();
    const numericRating = Number(rating);

    if (trimmedFeedback.length < 10 || trimmedFeedback.length > 500) {
      alert('Feedback deve ter entre 10 e 500 caracteres.');
      return;
    }

    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      alert('Avaliação deve ser um número entre 1 e 5.');
      return;
    }

    try {
      console.log('Enviando dados para feedback:', {
        feedback: trimmedFeedback,
        rating: numericRating,
      });
      await apiService.addFeedback(orderId, trimmedFeedback, numericRating);

      await apiService.confirmCompletion(orderId);

      setFeedbackModalOpen(false);
      setFeedbackText('');
      setRating(5);
      loadOrders();
    } catch (error) {
      console.error('Erro ao confirmar serviço:', error);
      if (error.response && error.response.data) {
        const { error: errMsg, details } = error.response.data;
        alert(`Erro: ${errMsg}\n${details.map((d) => `${d.path}: ${d.msg}`).join('\n')}`);
      } else {
        alert('Erro ao confirmar serviço. Tente novamente.');
      }
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4">
      <h1 className="text-3xl font-extrabold mb-6 text-gray-900">Minhas Ordens de Serviço</h1>

      {orders.length === 0 ? (
        <p className="text-center text-gray-600">Nenhuma ordem recente.</p>
      ) : (
        orders.map((order) => (
          <Card
            key={order.id}
            className="hover:shadow-lg transition-shadow rounded-lg border border-gray-200"
          >
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-800">{order.title}</h3>
                    <Badge
                      className={`${gradientStatusColors[order.status] || 'bg-gray-300'} shadow-md`}
                    >
                      {getStatusText(order.status)}
                    </Badge>
                    <Badge
                      className={`${gradientPriorityColors[order.priority] || 'bg-gray-200'} shadow-inner`}
                    >
                      {getPriorityText(order.priority)}
                    </Badge>
                  </div>
                  <p className="text-gray-700 mb-4">{order.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-400" /> Criada:{' '}
                      {formatDate(order.createdAt)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="w-5 h-5 text-gray-400" /> {order.establishmentName}
                    </div>
                    {order.technicianName && (
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-gray-400" /> Técnico: {order.technicianName}
                      </div>
                    )}
                  </div>
                </div>

                {/* Botão Cancelar */}
                {order.status === 'open' && (
                  <Button
                    className="bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 shadow-md"
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      setCancelModalOpen(true);
                    }}
                  >
                    Cancelar
                  </Button>
                )}

                {/* Botão Confirmar Serviço */}
                {order.userId === user.uid && order.status === 'completed' && (
                  <Button
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-md"
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      setFeedbackModalOpen(true);
                    }}
                  >
                    Confirmar Serviço
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Modal Cancelamento */}
      {cancelModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Cancelar Ordem</h2>
            <textarea
              className="border border-gray-300 rounded-md w-full p-3 mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-pink-400"
              rows={4}
              placeholder="Informe o motivo do cancelamento"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setCancelModalOpen(false)}>
                Fechar
              </Button>
              <Button
                className="bg-gradient-to-r from-red-500 to-pink-600 text-white hover:from-red-600 hover:to-pink-700 shadow-md"
                onClick={handleCancelOrder}
              >
                Cancelar Ordem
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Feedback */}
      {feedbackModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Confirmar Serviço</h2>
            <textarea
              className="border border-gray-300 rounded-md w-full p-3 mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-green-400"
              rows={4}
              placeholder="Deixe seu feedback sobre o serviço"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
            />
            <label className="block mb-4 text-gray-700 font-medium">
              Avaliação (1 a 5):
              <input
                type="number"
                min="1"
                max="5"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="ml-2 w-16 px-2 py-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </label>
            <div className="flex justify-end gap-3">
              <Button
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-md"
                onClick={() => handleConfirmService(selectedOrderId, feedbackText, rating)}
              >
                Enviar Feedback & Finalizar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserServiceOrders;
