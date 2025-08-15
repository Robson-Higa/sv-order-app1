import React, { useState, useEffect } from 'react';
import { Button } from '../../../components/ui/button';

const FinishOrderModal = ({ order, onClose, onConfirm }) => {
  const [startTime] = useState(order.startTime || new Date().toISOString());
  const [endTime] = useState(new Date().toISOString());
  const [description, setDescription] = useState('');

  const handleConfirm = () => {
    if (!description.trim()) {
      alert('Descreva o serviço realizado');
      return;
    }
    onConfirm({ startTime, endTime, description });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Finalizar Ordem</h2>

        <div className="space-y-2 text-sm text-gray-700">
          <p>
            <strong>OS:</strong> {order.title}
          </p>
          <p>
            <strong>Descrição:</strong> {order.description}
          </p>
          <p>
            <strong>Cliente:</strong> {order.userName}
          </p>
          <p>
            <strong>Estabelecimento:</strong> {order.establishmentName}
          </p>
          <p>
            <strong>Setor:</strong> {order.sector}
          </p>
        </div>

        <div className="mt-4 space-y-3">
          <textarea
            className="w-full border rounded p-2"
            placeholder="Descrição do serviço executado"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button onClick={onClose} className="bg-gray-400">
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="bg-green-600 text-white">
            Finalizar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FinishOrderModal;
