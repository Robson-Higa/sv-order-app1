import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { ServiceOrderStatus, UserType, AuthRequest, DashboardStats, TechnicianStats, AdminStats } from '../types';

export class DashboardController {
  async getDashboardData(req: AuthRequest, res: Response) {
    try {
      const userType = req.user?.userType;

      switch (userType) {
        case UserType.ADMIN:
          return this.getAdminDashboard(req, res);
        case UserType.TECHNICIAN:
          return this.getTechnicianDashboard(req, res);
        case UserType.END_USER:
          return this.getEndUserDashboard(req, res);
        default:
          return res.status(403).json({ error: 'Tipo de usuário inválido' });
      }
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  private async getAdminDashboard(req: AuthRequest, res: Response) {
    try {
      const serviceOrdersRef = db.collection('serviceOrders');
      const usersRef = db.collection('users');
      const establishmentsRef = db.collection('establishments');

      // Estatísticas de ordens de serviço
      const [
        totalOrdersSnapshot,
        openOrdersSnapshot,
        inProgressOrdersSnapshot,
        completedOrdersSnapshot,
        cancelledOrdersSnapshot
      ] = await Promise.all([
        serviceOrdersRef.get(),
        serviceOrdersRef.where('status', '==', ServiceOrderStatus.OPEN).get(),
        serviceOrdersRef.where('status', '==', ServiceOrderStatus.IN_PROGRESS).get(),
        serviceOrdersRef.where('status', '==', ServiceOrderStatus.COMPLETED).get(),
        serviceOrdersRef.where('status', '==', ServiceOrderStatus.CANCELLED).get()
      ]);

      // Estatísticas de usuários
      const [
        totalUsersSnapshot,
        techniciansSnapshot,
        activeUsersSnapshot
      ] = await Promise.all([
        usersRef.where('isActive', '==', true).get(),
        usersRef.where('userType', '==', UserType.TECHNICIAN).where('isActive', '==', true).get(),
        usersRef.where('isActive', '==', true).get()
      ]);

      // Estatísticas de estabelecimentos
      const establishmentsSnapshot = await establishmentsRef.where('isActive', '==', true).get();

      // Calcular média de avaliações
      const ordersWithRating = totalOrdersSnapshot.docs.filter(doc => doc.data().userRating);
      const averageRating = ordersWithRating.length > 0 
        ? ordersWithRating.reduce((sum, doc) => sum + doc.data().userRating, 0) / ordersWithRating.length 
        : 0;

      // Ordens deste mês
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const ordersThisMonthSnapshot = await serviceOrdersRef
        .where('createdAt', '>=', currentMonth)
        .get();

      // Ordens do mês passado
      const lastMonth = new Date(currentMonth);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const ordersLastMonthSnapshot = await serviceOrdersRef
        .where('createdAt', '>=', lastMonth)
        .where('createdAt', '<', currentMonth)
        .get();

      const adminStats: AdminStats = {
        totalOrders: totalOrdersSnapshot.size,
        openOrders: openOrdersSnapshot.size,
        inProgressOrders: inProgressOrdersSnapshot.size,
        completedOrders: completedOrdersSnapshot.size,
        cancelledOrders: cancelledOrdersSnapshot.size,
        averageRating: Math.round(averageRating * 100) / 100,
        ordersThisMonth: ordersThisMonthSnapshot.size,
        ordersLastMonth: ordersLastMonthSnapshot.size,
        totalUsers: totalUsersSnapshot.size,
        totalTechnicians: techniciansSnapshot.size,
        totalEstablishments: establishmentsSnapshot.size,
        activeUsers: activeUsersSnapshot.size
      };

      // Buscar ordens recentes
      const recentOrdersSnapshot = await serviceOrdersRef
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();

      const recentOrders = await Promise.all(
        recentOrdersSnapshot.docs.map(async (doc) => {
          const orderData = doc.data();
          const [userDoc, establishmentDoc] = await Promise.all([
            db.collection('users').doc(orderData.userId).get(),
            db.collection('establishments').doc(orderData.establishmentId).get()
          ]);

          return {
            id: doc.id,
            ...orderData,
            user: userDoc.exists ? { id: userDoc.id, name: userDoc.data()?.name } : null,
            establishment: establishmentDoc.exists ? { id: establishmentDoc.id, name: establishmentDoc.data()?.name } : null
          };
        })
      );

      res.json({
        stats: adminStats,
        recentOrders,
        userType: UserType.ADMIN
      });
    } catch (error) {
      console.error('Erro no dashboard do administrador:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  private async getTechnicianDashboard(req: AuthRequest, res: Response) {
    try {
      const technicianId = req.user!.id;
      const serviceOrdersRef = db.collection('serviceOrders');

      // Estatísticas do técnico
      const [
        totalOrdersSnapshot,
        assignedOrdersSnapshot,
        inProgressOrdersSnapshot,
        completedOrdersSnapshot,
        cancelledOrdersSnapshot
      ] = await Promise.all([
        serviceOrdersRef.where('technicianId', '==', technicianId).get(),
        serviceOrdersRef.where('technicianId', '==', technicianId).where('status', '==', ServiceOrderStatus.ASSIGNED).get(),
        serviceOrdersRef.where('technicianId', '==', technicianId).where('status', '==', ServiceOrderStatus.IN_PROGRESS).get(),
        serviceOrdersRef.where('technicianId', '==', technicianId).where('status', '==', ServiceOrderStatus.COMPLETED).get(),
        serviceOrdersRef.where('technicianId', '==', technicianId).where('status', '==', ServiceOrderStatus.CANCELLED).get()
      ]);

      // Calcular taxa de conclusão
      const completionRate = totalOrdersSnapshot.size > 0 
        ? (completedOrdersSnapshot.size / totalOrdersSnapshot.size) * 100 
        : 0;

      // Calcular média de avaliações
      const ordersWithRating = totalOrdersSnapshot.docs.filter(doc => doc.data().userRating);
      const averageRating = ordersWithRating.length > 0 
        ? ordersWithRating.reduce((sum, doc) => sum + doc.data().userRating, 0) / ordersWithRating.length 
        : 0;

      // Ordens deste mês
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const ordersThisMonthSnapshot = await serviceOrdersRef
        .where('technicianId', '==', technicianId)
        .where('createdAt', '>=', currentMonth)
        .get();

      // Ordens do mês passado
      const lastMonth = new Date(currentMonth);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const ordersLastMonthSnapshot = await serviceOrdersRef
        .where('technicianId', '==', technicianId)
        .where('createdAt', '>=', lastMonth)
        .where('createdAt', '<', currentMonth)
        .get();

      const technicianStats: TechnicianStats = {
        totalOrders: totalOrdersSnapshot.size,
        openOrders: 0, // Técnicos não veem ordens abertas
        assignedOrders: assignedOrdersSnapshot.size,
        inProgressOrders: inProgressOrdersSnapshot.size,
        completedOrders: completedOrdersSnapshot.size,
        cancelledOrders: cancelledOrdersSnapshot.size,
        averageRating: Math.round(averageRating * 100) / 100,
        ordersThisMonth: ordersThisMonthSnapshot.size,
        ordersLastMonth: ordersLastMonthSnapshot.size,
        completionRate: Math.round(completionRate * 100) / 100
      };

      // Buscar ordens atribuídas e em progresso
      const activeOrdersSnapshot = await serviceOrdersRef
        .where('technicianId', '==', technicianId)
        .where('status', 'in', [ServiceOrderStatus.ASSIGNED, ServiceOrderStatus.IN_PROGRESS])
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();

      const activeOrders = await Promise.all(
        activeOrdersSnapshot.docs.map(async (doc) => {
          const orderData = doc.data();
          const [userDoc, establishmentDoc] = await Promise.all([
            db.collection('users').doc(orderData.userId).get(),
            db.collection('establishments').doc(orderData.establishmentId).get()
          ]);

          return {
            id: doc.id,
            ...orderData,
            user: userDoc.exists ? { id: userDoc.id, name: userDoc.data()?.name } : null,
            establishment: establishmentDoc.exists ? { id: establishmentDoc.id, name: establishmentDoc.data()?.name } : null
          };
        })
      );

      res.json({
        stats: technicianStats,
        activeOrders,
        userType: UserType.TECHNICIAN
      });
    } catch (error) {
      console.error('Erro no dashboard do técnico:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  private async getEndUserDashboard(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const serviceOrdersRef = db.collection('serviceOrders');

      // Estatísticas do usuário
      const [
        totalOrdersSnapshot,
        openOrdersSnapshot,
        inProgressOrdersSnapshot,
        completedOrdersSnapshot,
        cancelledOrdersSnapshot
      ] = await Promise.all([
        serviceOrdersRef.where('userId', '==', userId).get(),
        serviceOrdersRef.where('userId', '==', userId).where('status', '==', ServiceOrderStatus.OPEN).get(),
        serviceOrdersRef.where('userId', '==', userId).where('status', 'in', [ServiceOrderStatus.ASSIGNED, ServiceOrderStatus.IN_PROGRESS]).get(),
        serviceOrdersRef.where('userId', '==', userId).where('status', 'in', [ServiceOrderStatus.COMPLETED, ServiceOrderStatus.CONFIRMED]).get(),
        serviceOrdersRef.where('userId', '==', userId).where('status', '==', ServiceOrderStatus.CANCELLED).get()
      ]);

      // Ordens deste mês
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      const ordersThisMonthSnapshot = await serviceOrdersRef
        .where('userId', '==', userId)
        .where('createdAt', '>=', currentMonth)
        .get();

      // Ordens do mês passado
      const lastMonth = new Date(currentMonth);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const ordersLastMonthSnapshot = await serviceOrdersRef
        .where('userId', '==', userId)
        .where('createdAt', '>=', lastMonth)
        .where('createdAt', '<', currentMonth)
        .get();

      const userStats: DashboardStats = {
        totalOrders: totalOrdersSnapshot.size,
        openOrders: openOrdersSnapshot.size,
        inProgressOrders: inProgressOrdersSnapshot.size,
        completedOrders: completedOrdersSnapshot.size,
        cancelledOrders: cancelledOrdersSnapshot.size,
        averageRating: 0, // Usuários não têm avaliação própria
        ordersThisMonth: ordersThisMonthSnapshot.size,
        ordersLastMonth: ordersLastMonthSnapshot.size
      };

      // Buscar ordens recentes
      const recentOrdersSnapshot = await serviceOrdersRef
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();

      const recentOrders = await Promise.all(
        recentOrdersSnapshot.docs.map(async (doc) => {
          const orderData = doc.data();
          const [technicianDoc, establishmentDoc] = await Promise.all([
            orderData.technicianId ? db.collection('users').doc(orderData.technicianId).get() : null,
            db.collection('establishments').doc(orderData.establishmentId).get()
          ]);

          return {
            id: doc.id,
            ...orderData,
            technician: technicianDoc?.exists ? { id: technicianDoc.id, name: technicianDoc.data()?.name } : null,
            establishment: establishmentDoc.exists ? { id: establishmentDoc.id, name: establishmentDoc.data()?.name } : null
          };
        })
      );

      res.json({
        stats: userStats,
        recentOrders,
        userType: UserType.END_USER
      });
    } catch (error) {
      console.error('Erro no dashboard do usuário:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getReports(req: AuthRequest, res: Response) {
    try {
      const { startDate, endDate, establishmentId, technicianId, status } = req.query;

      if (req.user?.userType !== UserType.ADMIN) {
        res.status(403).json({ error: 'Acesso negado' });
        return;
      }

      let query = db.collection('serviceOrders').orderBy('createdAt', 'desc');

      // Aplicar filtros
      if (startDate) {
        query = query.where('createdAt', '>=', new Date(startDate as string));
      }
      if (endDate) {
        query = query.where('createdAt', '<=', new Date(endDate as string));
      }
      if (establishmentId) {
        query = query.where('establishmentId', '==', establishmentId);
      }
      if (technicianId) {
        query = query.where('technicianId', '==', technicianId);
      }
      if (status) {
        query = query.where('status', '==', status);
      }

      const snapshot = await query.get();

      const orders = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const orderData = doc.data();
          const [userDoc, technicianDoc, establishmentDoc] = await Promise.all([
            db.collection('users').doc(orderData.userId).get(),
            orderData.technicianId ? db.collection('users').doc(orderData.technicianId).get() : null,
            db.collection('establishments').doc(orderData.establishmentId).get()
          ]);

          return {
            id: doc.id,
            ...orderData,
            user: userDoc.exists ? { id: userDoc.id, name: userDoc.data()?.name, email: userDoc.data()?.email } : null,
            technician: technicianDoc?.exists ? { id: technicianDoc.id, name: technicianDoc.data()?.name, email: technicianDoc.data()?.email } : null,
            establishment: establishmentDoc.exists ? { id: establishmentDoc.id, name: establishmentDoc.data()?.name, address: establishmentDoc.data()?.address } : null
          };
        })
      );
      res.json({ orders });
      return;
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
      return;
    }
  }
}


