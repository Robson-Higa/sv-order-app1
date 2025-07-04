import { Request, Response } from 'express';
import { db } from '../config/firebase';

export class DashboardController {
  // Dashboard principal (exemplo)
 async getStats(req: Request, res: Response) {
  try {
    // Coleta todos os documentos
    const ordersSnap = await db.collection('serviceOrders').get();
    const usersSnap = await db.collection('users').get();
    const establishmentsSnap = await db.collection('establishments').get();

    // Inicializa estatísticas
    const stats: Record<string, number> = {
      totalOrders: ordersSnap.size,
      openOrders: 0,
      inProgressOrders: 0,
      completedOrders: 0,
      assignedOrders: 0,
      totalUsers: usersSnap.size,
      totalEstablishments: establishmentsSnap.size,
    };
    // Contar ordens por status
    ordersSnap.forEach(doc => {
      const data = doc.data();
      const status = (data.status || '').toUpperCase();

      if (status === 'OPEN') stats.openOrders++;
      else if (status === 'IN_PROGRESS') stats.inProgressOrders++;
      else if (status === 'COMPLETED') stats.completedOrders++;

      // Se for técnico logado, contar ordens atribuídas a ele
      const loggedUser = (req as any).user;
      if (loggedUser?.userType === 'technician' && data?.technician?.email === loggedUser.email) {
        stats.assignedOrders++;
      }
    });

    // Contar usuários (apenas se admin)
    const user = (req as any).user;
    if (user?.userType === 'admin') {
      const usersSnap = await db.collection('users').get();
      stats.totalUsers = usersSnap.size;

      const establishmentsSnap = await db.collection('establishments').get();
      stats.totalEstablishments = establishmentsSnap.size;
    }

    res.json({ stats });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
}


  // Ordens recentes
  async getRecentOrders(req: Request, res: Response) {
    try {
      // Exemplo: retorna as 5 ordens mais recentes
      const ordersSnap = await db.collection('serviceOrders')
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();
      const orders = ordersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      res.json({ orders });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar ordens recentes' });
    }
  }

  // Relatórios (apenas admin)
  async getReports(req: Request, res: Response) {
    try {
      // Exemplo: retorna um relatório simples
      res.json({ message: 'Relatório gerado com sucesso!' });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao gerar relatório' });
    }
  }
}

export default DashboardController;


