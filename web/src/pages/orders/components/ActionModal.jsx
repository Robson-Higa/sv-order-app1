import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Textarea } from '../../../components/ui/textarea';

const ActionModal = ({ action, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');

  const actionLabels = {
    cancel: 'Cancelar Ordem',
    pause: 'Pausar Ordem',
    confirm: 'Confirmar Conclusão',
  };

  const handleConfirm = () => {
    if ((action === 'cancel' || action === 'pause') && !reason.trim()) {
      alert('Informe o motivo.');
      return;
    }
    onConfirm(action, reason);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <Card className="bg-white w-full max-w-lg">
        <CardHeader>
          <CardTitle>{actionLabels[action]}</CardTitle>
        </CardHeader>
        <CardContent>
          {(action === 'cancel' || action === 'pause') && (
            <div className="mb-4">
              <label className="block mb-2 text-gray-600">Motivo:</label>
              <Textarea
                placeholder="Descreva o motivo..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Voltar
            </Button>
            <Button className="bg-blue-600 text-white" onClick={handleConfirm}>
              Confirmar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActionModal;
