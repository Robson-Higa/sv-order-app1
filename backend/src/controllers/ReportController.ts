import e, { Request, Response } from 'express';
import { db } from '../config/firebase';
import admin from 'firebase-admin';

export class ReportController {

    private parseDate(dateStr?: string): admin.firestore.Timestamp | null {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return admin.firestore.Timestamp.fromDate(date);
  }
async getOrdersByEstablishment(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const startTimestamp = this.parseDate(startDate as string);
      const endTimestamp = this.parseDate(endDate as string);

    let query: admin.firestore.Query<admin.firestore.DocumentData> = db.collection('serviceOrders');

      // Filtrar intervalo de datas (updatedAt)
      if (startTimestamp) query = query.where('updatedAt', '>=', startTimestamp);
      if (endTimestamp) query = query.where('updatedAt', '<=', endTimestamp);

      const snapshot = await query.get();

      const counts: Record<string, number> = {};

      snapshot.forEach(doc => {
        const data = doc.data();
        const name = data.establishment?.name || 'Desconhecido';
        counts[name] = (counts[name] || 0) + 1;
      });

      return res.status(200).json({ data: counts });
    } catch (error) {
      console.error('Erro ao gerar relatório por estabelecimento:', error);
      return res.status(500).json({ error: 'Erro ao gerar relatório por estabelecimento' });
    }
  }

   async getOrdersByTechnician(req: Request, res: Response) {
  try {
    const { startDate, endDate } = req.query;

    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> =
      db.collection('serviceOrders');

    if (startDate) {
      query = query.where('createdAt', '>=', new Date(startDate as string));
    }
    if (endDate) {
      query = query.where('createdAt', '<=', new Date(endDate as string));
    }

    const snapshot = await query.get();

    const counts: Record<string, number> = {}; // ✅ Tipo definido
    snapshot.forEach((doc) => {
      const order = doc.data();
      const technicianName = order.technician?.name || 'Sem Técnico';
      counts[technicianName] = (counts[technicianName] || 0) + 1;
    });

    return res.json(counts);
  } catch (error) {
    console.error('Erro ao buscar ordens por técnico:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

 async getCompletedOrdersByDate(req: Request, res: Response) {
        try {
            const ordersRef = db.collection('serviceOrders');
            const snapshot = await ordersRef
            .where('status', '==', 'CONCLUÍDA')
            .get();

            const countsByDate: Record<string, number> = {};

            snapshot.forEach(doc => {
            const data = doc.data();
            const date = data.updatedAt?.toDate().toISOString().split('T')[0]; // 'YYYY-MM-DD'
            if (date) {
                countsByDate[date] = (countsByDate[date] || 0) + 1;
            }
            });

            return res.status(200).json({ data: countsByDate });
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao gerar relatório por data' });
        }
        }

        async getStatusPercentage(req: Request, res: Response) {
        try {
            const snapshot = await db.collection('serviceOrders').get();

            let total = 0;
            const counts: Record<string, number> = {};

            snapshot.forEach(doc => {
            const status = doc.data().status || 'INDEFINIDO';
            counts[status] = (counts[status] || 0) + 1;
            total += 1;
            });

            const percentages: Record<string, number> = {};
            for (const status in counts) {
            percentages[status] = parseFloat(((counts[status] / total) * 100).toFixed(2));
            }

            return res.status(200).json({ data: percentages });
        } catch (error) {
            return res.status(500).json({ error: 'Erro ao calcular porcentagem de status' });
        }
        }

      
}