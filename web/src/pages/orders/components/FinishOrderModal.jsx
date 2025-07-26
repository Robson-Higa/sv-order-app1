import React, { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';

const FinishOrderModal = ({ onClose, onConfirm }) => {
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    if (!notes.trim()) {
      alert('Descreva o serviço executado');
      return;
    }
    onConfirm(notes);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg bg-white shadow-lg">
        <CardHeader>
          <CardTitle>Finalizar Ordem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">Descreva o serviço realizado:</p>
          <Textarea
            placeholder="Detalhes do serviço..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button className="bg-green-600 text-white" onClick={handleConfirm}>
              Confirmar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinishOrderModal;
