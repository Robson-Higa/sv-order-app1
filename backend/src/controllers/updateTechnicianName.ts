import { db } from '../config/firebase';
import { Request, Response } from 'express';

export async function updateTechnicianNames(req: Request, res: Response) {
  try {
    const ordersRef = db.collection('serviceOrders');
    const snapshot = await ordersRef.where('technicianId', '!=', '').get();

    if (snapshot.empty) {
      return res.json({ message: 'Nenhuma OS encontrada com technicianId' });
    }

    let updatedCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();

      if (!data.technicianName && data.technicianId) {
        const userDoc = await db.collection('users').doc(data.technicianId).get();

        if (userDoc.exists) {
          const userName = userDoc.data()?.name || '';
          await doc.ref.update({ technicianName: userName });
          updatedCount++;
        }
      }
    }

    return res.json({ message: `Atualização concluída`, updated: updatedCount });
  } catch (error) {
    console.error('Erro ao atualizar technicianName:', error);
    return res.status(500).json({ error: 'Erro ao atualizar technicianName' });
  }
}
