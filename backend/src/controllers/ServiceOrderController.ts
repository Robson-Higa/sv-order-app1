import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { ServiceOrder, ServiceOrderStatus, UserType, Priority, AuthRequest, CreateServiceOrderRequest, UpdateServiceOrderRequest } from '../types';
import { generateId, generateOrderNumber } from '../utils/helpers';
import { Query } from 'firebase-admin/firestore';

export class ServiceOrderController {
  async getAllServiceOrders(req: AuthRequest, res: Response) {
    try {
      const { status, establishmentId, technicianId, userId, page = 1, limit = 20 } = req.query;

      let query = db.collection('serviceOrders').orderBy('createdAt', 'desc');
      
      // Filtros baseados no tipo de usuário
      if (req.user?.userType === UserType.TECHNICIAN) {
        query = query.where('technicianId', '==', req.user.id);
      } else if (req.user?.userType === UserType.END_USER) {
        query = query.where('userId', '==', req.user.id);
      }

      // Aplicar filtros adicionais
      if (status) {
        query = query.where('status', '==', status);
      }
      if (establishmentId) {
        query = query.where('establishmentId', '==', establishmentId);
      }
      if (technicianId && req.user?.userType === UserType.ADMIN) {
        query = query.where('technicianId', '==', technicianId);
      }
      if (userId && req.user?.userType === UserType.ADMIN) {
        query = query.where('userId', '==', userId);
      }

      // Paginação
      const pageNumber = parseInt(page as string);
      const limitNumber = parseInt(limit as string);
      const offset = (pageNumber - 1) * limitNumber;

      const snapshot = await query.limit(limitNumber).offset(offset).get();

      const serviceOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ServiceOrder[];

      // Buscar informações adicionais (usuário, técnico, estabelecimento)
      const enrichedOrders = await Promise.all(
        serviceOrders.map(async (order) => {
          const [userDoc, technicianDoc, establishmentDoc] = await Promise.all([
            order.userId ? db.collection('users').doc(order.userId).get() : null,
            order.technicianId ? db.collection('users').doc(order.technicianId).get() : null,
            order.establishmentId ? db.collection('establishments').doc(order.establishmentId).get() : null
          ]);

          return {
            ...order,
            user: userDoc && userDoc.exists ? { id: userDoc.id, name: userDoc.data()?.name } : null,
            technician: technicianDoc && technicianDoc.exists ? { id: technicianDoc.id, name: technicianDoc.data()?.name } : null,
            establishment: establishmentDoc && establishmentDoc.exists ? { id: establishmentDoc.id, name: establishmentDoc.data()?.name } : null
          };
        })
      );

      res.json({ serviceOrders: enrichedOrders });
    } catch (error) {
      console.error('Erro ao buscar ordens de serviço:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getServiceOrderById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const serviceOrderDoc = await db.collection('serviceOrders').doc(id).get();

      if (!serviceOrderDoc.exists) {
        return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
      }

      const serviceOrder = {
        id: serviceOrderDoc.id,
        ...serviceOrderDoc.data()
      } as ServiceOrder;

      // Verificar permissões
      if (req.user?.userType === UserType.END_USER && serviceOrder.userId !== req.user.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }
      if (req.user?.userType === UserType.TECHNICIAN && serviceOrder.technicianId !== req.user.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      // Buscar informações adicionais
      const [userDoc, technicianDoc, establishmentDoc] = await Promise.all([
        serviceOrder.userId ? db.collection('users').doc(serviceOrder.userId).get() : null,
        serviceOrder.technicianId ? db.collection('users').doc(serviceOrder.technicianId).get() : null,
        serviceOrder.establishmentId ? db.collection('establishments').doc(serviceOrder.establishmentId).get() : null
      ]);

      const enrichedOrder = {
        ...serviceOrder,
        user: userDoc && userDoc.exists ? { id: userDoc.id, name: userDoc.data()?.name, email: userDoc.data()?.email } : null,
        technician: technicianDoc && technicianDoc.exists ? { id: technicianDoc.id, name: technicianDoc.data()?.name, email: technicianDoc.data()?.email } : null,
        establishment: establishmentDoc && establishmentDoc.exists ? { id: establishmentDoc.id, name: establishmentDoc.data()?.name, address: establishmentDoc.data()?.address } : null
      };

      res.json({ serviceOrder: enrichedOrder });
      return;
    } catch (error) {
      console.error('Erro ao buscar ordem de serviço:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
      return;
    }
  }

  async createServiceOrder(req: AuthRequest, res: Response) {
    try {
      const { title, description, priority, establishmentName, technicianName, scheduledAt } = req.body;

      console.log('Payload recebido:', req.body);

      // Validação dos campos obrigatórios
      if (!title || !description || !establishmentName || !priority || !technicianName) {
        return res.status(400).json({ error: 'Campos obrigatórios: title, description, establishmentName, priority, technicianName' });
      }

      // Buscar ou criar estabelecimento pelo nome
      let establishmentId: string | undefined;
      let establishmentDoc = await db.collection('establishments')
        .where('name', '==', establishmentName)
        .limit(1)
        .get();

      if (!establishmentDoc.empty) {
        establishmentId = establishmentDoc.docs[0].id;
      } else {
        // Cria novo estabelecimento se não existir
        const newEstablishmentRef = db.collection('establishments').doc();
        await newEstablishmentRef.set({ name: establishmentName });
        establishmentId = newEstablishmentRef.id;
      }

      // Buscar técnico pelo nome
      let technicianId: string | undefined;
      let technicianDoc = await db.collection('users')
        .where('name', '==', technicianName)
        .where('userType', '==', UserType.TECHNICIAN)
        .limit(1)
        .get();

      if (!technicianDoc.empty) {
        technicianId = technicianDoc.docs[0].id;
      } else {
        return res.status(400).json({ error: 'Técnico não encontrado pelo nome informado' });
      }

      const serviceOrderId = generateId();
      const orderNumber = generateOrderNumber();

      const newServiceOrder: Partial<ServiceOrder> = {
        id: serviceOrderId,
        orderNumber,
        title,
        description,
        priority,
        establishmentId,
        technicianId,
        status: ServiceOrderStatus.OPEN,
        createdAt: new Date(),
        updatedAt: new Date(),
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      };

      await db.collection('serviceOrders').doc(serviceOrderId).set(newServiceOrder);

      res.status(201).json({
        message: 'Ordem de serviço criada com sucesso',
        serviceOrder: newServiceOrder
      });
      return;
    } catch (error) {
      console.error('Erro ao criar ordem de serviço:', error);
      res.status(500).json({ error: 'Erro interno do servidor', details: error instanceof Error ? error.message : error });
      return;
    }
  }

  async updateServiceOrder(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const updateData: UpdateServiceOrderRequest = req.body;

      const serviceOrderDoc = await db.collection('serviceOrders').doc(id);
      const serviceOrderSnapshot = await serviceOrderDoc.get();

      if (!serviceOrderSnapshot.exists) {
        return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
      }

      const serviceOrder = serviceOrderSnapshot.data() as ServiceOrder;

      // Verificar permissões
      if (req.user?.userType === UserType.END_USER && serviceOrder.userId !== req.user.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }
      if (req.user?.userType === UserType.TECHNICIAN && serviceOrder.technicianId !== req.user.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const updates: Partial<ServiceOrder> = {
        updatedAt: new Date()
      };

      // Campos que podem ser atualizados baseado no tipo de usuário
      if (req.user?.userType === UserType.ADMIN) {
        if (updateData.title) updates.title = updateData.title;
        if (updateData.description) updates.description = updateData.description;
        if (updateData.status) updates.status = updateData.status;
        if (updateData.priority) updates.priority = updateData.priority;
        if (updateData.scheduledAt) updates.scheduledAt = new Date(updateData.scheduledAt);
        if (updateData.technicianNotes) updates.technicianNotes = updateData.technicianNotes;
      } else if (req.user?.userType === UserType.TECHNICIAN) {
        if (updateData.status && [ServiceOrderStatus.IN_PROGRESS, ServiceOrderStatus.COMPLETED].includes(updateData.status)) {
          updates.status = updateData.status;
          if (updateData.status === ServiceOrderStatus.COMPLETED) {
            updates.completedAt = new Date();
          }
        }
        if (updateData.technicianNotes) updates.technicianNotes = updateData.technicianNotes;
      } else if (req.user?.userType === UserType.END_USER) {
        if (updateData.userFeedback) updates.userFeedback = updateData.userFeedback;
        if (updateData.userRating) updates.userRating = updateData.userRating;
        
        // Usuário pode confirmar o serviço apenas se estiver completo
        if (serviceOrder.status === ServiceOrderStatus.COMPLETED && updateData.userFeedback && updateData.userRating) {
          updates.useConfimed = true;
          updates.status = ServiceOrderStatus.CONFIRMED;
        }
      }

      await serviceOrderDoc.update(updates);

      // Buscar dados atualizados
      const updatedServiceOrderSnapshot = await serviceOrderDoc.get();
      const updatedServiceOrder = {
        id: updatedServiceOrderSnapshot.id,
        ...updatedServiceOrderSnapshot.data()
      } as ServiceOrder;

      res.json({
        message: 'Ordem de serviço atualizada com sucesso',
        serviceOrder: updatedServiceOrder
      });
      return;
    } catch (error) {
      console.error('Erro ao atualizar ordem de serviço:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
      return;
    }
  }

  async assignTechnician(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { technicianId } = req.body;

      if (req.user?.userType !== UserType.ADMIN) {
        return res.status(403).json({ error: 'Apenas administradores podem atribuir técnicos' });
      }

      // Verificar se o técnico existe
      const technicianDoc = await db.collection('users').doc(technicianId).get();
      if (!technicianDoc.exists || technicianDoc.data()?.userType !== UserType.TECHNICIAN) {
        return res.status(400).json({ error: 'Técnico não encontrado' });
      }

      const serviceOrderDoc = await db.collection('serviceOrders').doc(id);
      const serviceOrderSnapshot = await serviceOrderDoc.get();

      if (!serviceOrderSnapshot.exists) {
        return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
      }

      await serviceOrderDoc.update({
        technicianId,
        status: ServiceOrderStatus.ASSIGNED,
        updatedAt: new Date()
      });

      return res.json({ message: 'Técnico atribuído com sucesso' });
    } catch (error) {
      console.error('Erro ao atribuir técnico:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async cancelServiceOrder(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const serviceOrderDoc = await db.collection('serviceOrders').doc(id);
      const serviceOrderSnapshot = await serviceOrderDoc.get();

      if (!serviceOrderSnapshot.exists) {
        return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
      }

      const serviceOrder = serviceOrderSnapshot.data() as ServiceOrder;

      // Verificar permissões
      if (req.user?.userType === UserType.END_USER && serviceOrder.userId !== req.user.id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      // Verificar se pode ser cancelada
      if ([ServiceOrderStatus.COMPLETED, ServiceOrderStatus.CONFIRMED, ServiceOrderStatus.CANCELLED].includes(serviceOrder.status)) {
        return res.status(400).json({ error: 'Esta ordem de serviço não pode ser cancelada' });
      }

      await serviceOrderDoc.update({
        status: ServiceOrderStatus.CANCELLED,
        cancellationReason: reason,
        updatedAt: new Date()
      });

      return res.json({ message: 'Ordem de serviço cancelada com sucesso' });
    } catch (error) {
      console.error('Erro ao cancelar ordem de serviço:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getServiceOrderStats(req: AuthRequest, res: Response) {
    try {
      const serviceOrdersRef = db.collection('serviceOrders');

      let baseQuery: FirebaseFirestore.Query = serviceOrdersRef;
      
      // Filtrar por usuário se não for admin
      if (req.user?.userType === UserType.TECHNICIAN) {
        baseQuery = serviceOrdersRef.where('technicianId', '==', req.user.id);
      } else if (req.user?.userType === UserType.END_USER) {
        baseQuery = serviceOrdersRef.where('userId', '==', req.user.id);
      }

      const [
        totalSnapshot,
        openSnapshot,
        assignedSnapshot,
        inProgressSnapshot,
        completedSnapshot,
        confirmedSnapshot,
        cancelledSnapshot
      ] = await Promise.all([
        baseQuery.get(),
        baseQuery.where('status', '==', ServiceOrderStatus.OPEN).get(),
        baseQuery.where('status', '==', ServiceOrderStatus.ASSIGNED).get(),
        baseQuery.where('status', '==', ServiceOrderStatus.IN_PROGRESS).get(),
        baseQuery.where('status', '==', ServiceOrderStatus.COMPLETED).get(),
        baseQuery.where('status', '==', ServiceOrderStatus.CONFIRMED).get(),
        baseQuery.where('status', '==', ServiceOrderStatus.CANCELLED).get()
      ]);

      const stats = {
        total: totalSnapshot.size,
        open: openSnapshot.size,
        assigned: assignedSnapshot.size,
        inProgress: inProgressSnapshot.size,
        completed: completedSnapshot.size,
        confirmed: confirmedSnapshot.size,
        cancelled: cancelledSnapshot.size
      };

      res.json({ stats });
    } catch (error: unknown) {
      console.error('Erro ao buscar estatísticas de ordens de serviço:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}

