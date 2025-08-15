import { Request, Response } from 'express';
import { db } from '../config/firebase';

export class ReportController {
  /**
   * 🔍 Filtro base para Firestore (datas)
   */
  private buildQuery(startDate?: string, endDate?: string) {
    let query: FirebaseFirestore.Query = db.collection('serviceOrders');

    if (startDate) {
      query = query.where('createdAt', '>=', new Date(startDate));
    }
    if (endDate) {
      query = query.where('createdAt', '<=', new Date(endDate));
    }

    return query;
  }

  /**
   * ✅ 1. Porcentagem por status (geral)
   */
  async getStatusPercentage(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const query = this.buildQuery(startDate as string, endDate as string);
      const snapshot = await query.get();

      const statusCount: Record<string, number> = {
        OPEN: 0,
        ASSIGNED: 0,
        IN_PROGRESS: 0,
        COMPLETED: 0,
        CANCELED: 0,
      };

      snapshot.forEach((doc) => {
        const data = doc.data();
        const status = data.status || 'OPEN';
        if (statusCount[status] !== undefined) {
          statusCount[status]++;
        }
      });

      res.json(statusCount);
    } catch (error) {
      console.error('Erro ao buscar porcentagem por status:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  /**
   * ✅ 2. Quantidade por Estabelecimento
   */
  async getOrdersByEstablishment(req: Request, res: Response) {
    try {
      const { startDate, endDate, establishmentName } = req.query;
      let query = this.buildQuery(startDate as string, endDate as string);

      if (establishmentName) {
        query = query.where('establishment.name', '==', String(establishmentName).toLowerCase());
      }

      const snapshot = await query.get();
      const countByEstablishment: Record<string, number> = {};

      snapshot.forEach((doc) => {
        const data = doc.data();
        const name = data.establishment?.name || 'Sem Estabelecimento';
        countByEstablishment[name] = (countByEstablishment[name] || 0) + 1;
      });

      res.json(countByEstablishment);
    } catch (error) {
      console.error('Erro ao buscar ordens por estabelecimento:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  /**
   * ✅ 3. Quantidade por Técnico
   */
  async getOrdersByTechnician(req: Request, res: Response) {
    try {
      const { startDate, endDate, technicianName } = req.query;
      let query = this.buildQuery(startDate as string, endDate as string);

      if (technicianName) {
        query = query.where('technician.name', '==', String(technicianName).toLowerCase());
      }

      const snapshot = await query.get();
      const countByTechnician: Record<string, number> = {};

      snapshot.forEach((doc) => {
        const data = doc.data();
        const name = data.technician?.name || 'Sem Técnico';
        countByTechnician[name] = (countByTechnician[name] || 0) + 1;
      });

      res.json(countByTechnician);
    } catch (error) {
      console.error('Erro ao buscar ordens por técnico:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }

  /**
   * ✅ 4. Evolução de ordens por mês (completas e totais)
   */
  async getCompletedOrdersByDate(req: Request, res: Response) {
    try {
      const { startDate, endDate, technicianName, establishmentName } = req.query;

      let query = db.collection('serviceOrders') as FirebaseFirestore.Query;

      // 🔍 FILTROS OPCIONAIS (atenção: criar índices compostos no Firestore)
      if (startDate) query = query.where('createdAt', '>=', new Date(startDate as string));
      if (endDate) query = query.where('createdAt', '<=', new Date(endDate as string));
      if (technicianName)
        query = query.where('technician.name', '==', String(technicianName).toLowerCase());
      if (establishmentName)
        query = query.where('establishment.name', '==', String(establishmentName).toLowerCase());

      const snapshot = await query.get();
      const orders = snapshot.docs.map((doc) => doc.data());

      // ✅ Meses em PT-BR
      const months = [
        'Jan',
        'Fev',
        'Mar',
        'Abr',
        'Mai',
        'Jun',
        'Jul',
        'Ago',
        'Set',
        'Out',
        'Nov',
        'Dez',
      ];

      const monthlyData: Record<string, { total: number; completed: number }> = {};
      months.forEach((month) => {
        monthlyData[month] = { total: 0, completed: 0 };
      });

      orders.forEach((order: any) => {
        const createdAt = order.createdAt?.toDate
          ? order.createdAt.toDate()
          : new Date(order.createdAt);
        const monthName = months[createdAt.getMonth()];

        if (monthName) {
          monthlyData[monthName].total += 1;
          if (order.status === 'COMPLETED') {
            monthlyData[monthName].completed += 1;
          }
        }
      });

      // 🔍 Retornar ARRAY para Recharts
      const responseData = months.map((month) => ({
        name: month,
        total: monthlyData[month].total,
        completed: monthlyData[month].completed,
      }));

      return res.json(responseData);
    } catch (error) {
      console.error('Erro no relatório mensal:', error);
      return res.status(500).json({ message: 'Erro ao gerar relatório mensal' });
    }
  }

  async getOrdersReport(req: Request, res: Response) {
    try {
      const { startDate, endDate, technicianId, establishmentId } = req.query;

      if (!startDate || !endDate) {
        return res
          .status(400)
          .json({ error: 'Os parâmetros startDate e endDate são obrigatórios.' });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);

      console.log('📌 [ReportController] Filtros:', {
        startDate,
        endDate,
        technicianId,
        establishmentId,
      });

      let query: FirebaseFirestore.Query = db
        .collection('serviceOrders')
        .where('createdAt', '>=', start)
        .where('createdAt', '<=', end);

      if (technicianId) query = query.where('technicianId', '==', technicianId);
      if (establishmentId) query = query.where('establishmentId', '==', establishmentId);

      const snapshot = await query.orderBy('createdAt', 'asc').get();

      console.log(`📌 Total de ordens encontradas: ${snapshot.size}`);

      const orders = snapshot.docs.map((doc) => {
        const data = doc.data();
        // return {
        //   id: doc.id,
        //   orderNumber: data.orderNumber || '',
        //   title: data.title || '',
        //   description: data.description || '',
        //   status: data.status || '',
        //   priority: data.priority || '',
        //   technicianName: data.technicianName || '',
        //   establishmentName: data.establishmentName || '',
        //   sector: data.sector || '',
        //   createdAt: data.createdAt ? data.createdAt.toDate().toLocaleString('pt-BR') : '',
        //   updatedAt: data.updatedAt ? data.updatedAt.toDate().toLocaleString('pt-BR') : '',
        //   solution: data.solution || '',
        //   feedback: data.feedback || '',
        //   cancelReason: data.cancellationReason?.reason || '',
        //   pauseReason: data.pauseReason || '',
        //   userName: data.userName || '',
        // };
        return {
          id: doc.id,
          orderNumber: data.orderNumber,
          title: data.title,
          status: data.status,
          priority: data.priority,
          technicianName: data.technicianName || '',
          technicianNotes: data.technicianNotes || '',
          establishmentName: data.establishmentName || '',
          sector: data.sector || '',
          userName: data.userName || '',
          createdAt: data.createdAt ? data.createdAt.toDate().toLocaleString('pt-BR') : '',
          scheduledAt: data.scheduledAt ? data.scheduledAt.toDate().toLocaleString('pt-BR') : '',
          startTime: data.startTime ? data.startTime.toDate().toLocaleString('pt-BR') : '',
          endTime: data.endTime ? data.endTime.toDate().toLocaleString('pt-BR') : '',
          completedAt: data.completedAt ? data.completedAt.toDate().toLocaleString('pt-BR') : '',
          solution: data.solution || '',
          userFeedback: data.userFeedback || '',
          userRating: data.userRating ?? null,
          userConfirmed: data.userConfirmed ?? false,
          cancelReason: data.cancellationReason?.reason || '',
          pauseReason: data.pauseReason || '',
          updatedAt: data.updatedAt ? data.updatedAt.toDate().toLocaleString('pt-BR') : '',
          description: data.description || '',
        };
      });

      return res.json({ orders });
    } catch (error) {
      console.error('❌ Erro ao gerar relatório:', error);
      return res.status(500).json({ error: 'Erro ao gerar relatório' });
    }
  }
}
