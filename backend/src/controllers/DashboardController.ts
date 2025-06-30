import { Request, Response } from 'express';
import { db } from '../config/firebase';

export class DashboardController {
  // Dashboard principal (exemplo)
  async getDashboardData(req: Request, res: Response) {
    try {
      // Exemplo: retorna contagem de ordens e usuários
      const ordersSnap = await db.collection('serviceOrders').get();
      const usersSnap = await db.collection('users').get();
      res.json({
        totalOrders: ordersSnap.size,
        totalUsers: usersSnap.size,
      });
    } catch (error) {
      res.status(500).json({ error: 'Erro ao buscar dados do dashboard' });
    }
  }

  // Estatísticas do dashboard
  async getStats(req: Request, res: Response) {
    try {
      // Exemplo: retorna contagem de ordens por status
      const ordersSnap = await db.collection('serviceOrders').get();
      const stats: Record<string, number> = {};
      ordersSnap.forEach(doc => {
        const status = doc.data().status || 'desconhecido';
        stats[status] = (stats[status] || 0) + 1;
      });
      res.json({ stats });
    } catch (error) {
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


