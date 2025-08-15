import { Request, Response } from 'express';
import { db } from '../config/firebase';

export class DashboardController {
  
async getDashboardData(req: Request, res: Response) {
  try {
    // Pega estatísticas
    const ordersSnap = await db.collection('serviceOrders').get();
    const usersSnap = await db.collection('users').get();
    const establishmentsSnap = await db.collection('establishments').get();

    const stats: Record<string, number> = {
      totalOrders: ordersSnap.size,
      openOrders: 0,
      inProgressOrders: 0,
      completedOrders: 0,
      assignedOrders: 0,
      totalUsers: usersSnap.size,
      totalEstablishments: establishmentsSnap.size,
    };

    const loggedUser = (req as any).user;
    ordersSnap.forEach(doc => {
      const data = doc.data();
       console.log('Status da ordem:', data.status);
      const status = (data.status || '').toLowerCase();

  if (status === 'open') stats.openOrders++;
  else if (status === 'in_progress') stats.inProgressOrders++;
  else if (status === 'completed') stats.completedOrders++;
  else if (status === 'assigned') stats.assignedOrders++;

      if (
        loggedUser?.userType === 'technician' &&
        data?.technician?.email === loggedUser.email
      ) {
        stats.assignedOrders++;
      }
    });

    if (loggedUser?.userType === 'admin') {
      stats.totalUsers = usersSnap.size;
      stats.totalEstablishments = establishmentsSnap.size;
    }

    // Pega ordens recentes
    const recentOrdersSnap = await db
      .collection('serviceOrders')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    const recentOrders = recentOrdersSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ stats, recentOrders });
  } catch (error) {
    console.error('Erro no dashboard:', error);
    res.status(500).json({ error: 'Erro ao carregar dados do dashboard' });
  }
}


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
       console.log('Status da ordem:', data.status);
      const status = (data.status || '').toLowerCase();

  if (status === 'open') stats.openOrders++;
  else if (status === 'in_progress') stats.inProgressOrders++;
  else if (status === 'completed') stats.completedOrders++;
  else if (status === 'assigned') stats.assignedOrders++;

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

  async getUsers(req: Request, res: Response) {
  try {
    const { userType } = req.query;

   let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> =
  db.collection('users');


    if (userType) {
      query = query.where('userType', '==', userType);
    }

    const usersSnap = await query.get();
    const users = usersSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ users });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
}
}

export default DashboardController;


