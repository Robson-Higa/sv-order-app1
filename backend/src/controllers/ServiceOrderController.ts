import { Request, Response } from 'express';
import { db } from '../config/firebase';
import {
  ServiceOrder,
  ServiceOrderStatus,
  UserType,
  Priority,
  AuthRequest,
  CreateServiceOrderRequest,
  UpdateServiceOrderRequest,
} from '../types';
import { generateId, generateOrderNumber } from '../utils/helpers';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import whatsappService from '../services/whatsappService';

dayjs.locale('pt-br');

export class ServiceOrderController {
  async getAllServiceOrders(req: AuthRequest, res: Response) {
    try {
      const { status, priority, technicianId, establishmentId, scope, title } = req.query;
      const user = req.user;

      if (!user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      console.log('📌 [ServiceOrders] Requisição recebida');
      console.log('➡ Filtros recebidos:', {
        status,
        priority,
        technicianId,
        establishmentId,
        scope,
      });
      console.log('➡ Usuário autenticado:', {
        uid: user.uid,
        userType: user.userType,
        establishmentId: user.establishmentId,
        name: user.name,
      });

      let query: FirebaseFirestore.Query = db.collection('serviceOrders');

      // Filtros dinâmicos
      if (status) query = query.where('status', '==', status);
      if (priority) query = query.where('priority', '==', priority);
      if (technicianId) query = query.where('technicianId', '==', technicianId);
      if (establishmentId) query = query.where('establishmentId', '==', establishmentId);

      if (scope === 'mine') {
        if (user.userType === UserType.TECHNICIAN) {
          query = query.where('technicianId', '==', user.uid);
        } else {
          query = query.where('userId', '==', user.uid);
        }
      } else if (scope === 'establishment') {
        query = query.where('establishmentId', '==', user.establishmentId);
      }

      // Segurança adicional para END_USER
      if (user.userType === UserType.END_USER) {
        if (scope === 'mine') {
          query = query.where('userId', '==', user.uid);
        } else {
          query = query.where('establishmentId', '==', user.establishmentId);
        }
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      query = query.limit(limit);

      console.log('📌 Executando query no Firestore...');
      const ordersSnap = await query.get();

      console.log(`📌 Total de ordens encontradas: ${ordersSnap.size}`);

      query = query.orderBy('createdAt', 'desc');
      const resultLimit = typeof limit === 'string' ? parseInt(limit, 10) : 100;

      query = query.limit(resultLimit);

      const snapshot = await query.get();

      let orders: ServiceOrder[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<ServiceOrder, 'id'>),
      }));

      // ✅ Filtro por título (em memória)
      if (title && typeof title === 'string') {
        const lowerTitle = title.toLowerCase().trim();
        orders = orders.filter(
          (order) => order.title && order.title.toLowerCase().includes(lowerTitle)
        );
      }

      return res.status(200).json({ serviceOrders: orders });
    } catch (error) {
      console.error('❌ Erro ao buscar ordens:', error);
      return res.status(500).json({ error: 'Erro ao buscar ordens' });
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
        ...serviceOrderDoc.data(),
      } as ServiceOrder;

      // Verificar permissões
      if (req.user?.userType === UserType.END_USER && serviceOrder.userId !== req.user.uid) {
        return res.status(403).json({ error: 'Acesso negado' });
      }
      // if (
      //   req.user?.userType === UserType.TECHNICIAN &&
      //   serviceOrder.technicianId !== req.user.uid
      // ) {
      //   return res.status(403).json({ error: 'Acesso negado' });
      // }

      // Buscar informações adicionais
      const [userDoc, technicianDoc, establishmentDoc] = await Promise.all([
        serviceOrder.userId ? db.collection('users').doc(serviceOrder.userId).get() : null,
        serviceOrder.technicianId
          ? db.collection('users').doc(serviceOrder.technicianId).get()
          : null,
        serviceOrder.establishmentId
          ? db.collection('establishments').doc(serviceOrder.establishmentId).get()
          : null,
      ]);

      const enrichedOrder = {
        ...serviceOrder,
        user:
          userDoc && userDoc.exists
            ? { id: userDoc.id, name: userDoc.data()?.name, email: userDoc.data()?.email }
            : null,
        technician:
          technicianDoc && technicianDoc.exists
            ? {
                id: technicianDoc.id,
                name: technicianDoc.data()?.name,
                email: technicianDoc.data()?.email,
              }
            : null,
        establishment:
          establishmentDoc && establishmentDoc.exists
            ? {
                id: establishmentDoc.id,
                name: establishmentDoc.data()?.name,
                address: establishmentDoc.data()?.address,
              }
            : null,
      };

      return res.json({ serviceOrder: enrichedOrder });
    } catch (error) {
      console.error('Erro ao buscar ordem de serviço:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async createServiceOrder(req: AuthRequest, res: Response) {
    try {
      const {
        title,
        description,
        priority,
        establishmentName,
        sector,
        technicianName,
        scheduledAt,
      } = req.body;

      // Validação dos campos obrigatórios
      if (!title || !description || !establishmentName || !priority) {
        return res.status(400).json({
          error: 'Campos obrigatórios: title, description, establishmentName, priority',
        });
      }

      // Buscar ou criar estabelecimento pelo nome
      let establishmentId: string | undefined;
      const establishmentDoc = await db
        .collection('establishments')
        .where('name', '==', establishmentName)
        .limit(1)
        .get();

      if (!establishmentDoc.empty) {
        establishmentId = establishmentDoc.docs[0].id;
      } else {
        const newEstablishmentRef = db.collection('establishments').doc();
        await newEstablishmentRef.set({
          name: establishmentName,
          createdAt: new Date(),
        });
        establishmentId = newEstablishmentRef.id;
      }

      // Buscar técnico pelo nome (se informado)
      let technicianId: string | null = null;
      if (technicianName && technicianName.trim() !== '') {
        const technicianDoc = await db
          .collection('users')
          .where('name', '==', technicianName)
          .where('userType', '==', UserType.TECHNICIAN)
          .limit(1)
          .get();

        if (!technicianDoc.empty) {
          technicianId = technicianDoc.docs[0].id;
        } else {
          return res.status(400).json({ error: 'Técnico não encontrado pelo nome informado' });
        }
      }

      const serviceOrderId = generateId();
      const orderNumber = generateOrderNumber();
      const userId = req.user?.uid || '';
      const userName = req.user?.name || '';

      const normalizedStatus = ServiceOrderStatus.OPEN.toLowerCase();
      const normalizedPriority = priority.toLowerCase();

      const newServiceOrder: Record<string, any> = {
        id: serviceOrderId,
        orderNumber,
        title,
        description,
        priority: normalizedPriority,
        establishmentId,
        establishmentName,
        sector: sector || null, // ✅ adicionando setor
        userId,
        userName,
        status: ServiceOrderStatus.OPEN,
        createdAt: new Date(),
        updatedAt: new Date(),
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      };

      if (technicianId) {
        newServiceOrder.technicianId = technicianId;
        newServiceOrder.technicianName = technicianName;
      }

      await db.collection('serviceOrders').doc(serviceOrderId).set(newServiceOrder);

      // Buscar o telefone do usuário para enviar notificação via WhatsApp
      try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
          const userData = userDoc.data();
          if (userData?.phone) {
            // Enviar notificação via WhatsApp
            await whatsappService.notifyOrderCreation(
              newServiceOrder as ServiceOrder,
              userData.phone
            );
          }
        }
      } catch (error) {
        console.error('Erro ao enviar notificação WhatsApp:', error);
        // Não interrompe o fluxo se a notificação falhar
      }

      return res.status(201).json({
        message: 'Ordem de serviço criada com sucesso',
        serviceOrder: newServiceOrder,
      });
    } catch (error) {
      console.error('Erro ao criar ordem de serviço:', error);
      return res.status(500).json({
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : error,
      });
    }
  }

  async updateStatus(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status, technicianNotes, reason, startTime, endTime } = req.body;
      const user = req.user;

      if (!user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const serviceOrderRef = db.collection('serviceOrders').doc(id);
      const snapshot = await serviceOrderRef.get();

      if (!snapshot.exists) {
        return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
      }

      const serviceOrder = snapshot.data() as ServiceOrder;

      // ✅ Valida transições e permissões
      const isAdmin = user.userType === UserType.ADMIN;
      const isTechnician = user.userType === UserType.TECHNICIAN;
      const isEndUser = user.userType === UserType.END_USER;

      if (!isAdmin) {
        if (isTechnician) {
          const allowed = [
            ServiceOrderStatus.IN_PROGRESS,
            ServiceOrderStatus.PAUSED,
            ServiceOrderStatus.COMPLETED,
          ];
          if (!allowed.includes(status)) {
            return res.status(403).json({ error: 'Técnico não pode alterar para este status' });
          }
        } else if (isEndUser) {
          const allowed = [ServiceOrderStatus.CANCELLED];
          if (!allowed.includes(status)) {
            return res
              .status(403)
              .json({ error: 'Usuário final não pode alterar para este status' });
          }
        }
      }

      // ✅ Força motivo se CANCELLED ou PAUSED
      if (
        (status === ServiceOrderStatus.CANCELLED || status === ServiceOrderStatus.PAUSED) &&
        !reason
      ) {
        return res.status(400).json({ error: 'Informe o motivo para cancelar ou pausar a ordem' });
      }
      console.log('📌 Body recebido em updateStatus:', req.body);

      // ✅ Monta updates
      const updates: Partial<ServiceOrder> = {
        status,
        updatedAt: new Date(),
        ...(status === 'CANCELLED' && {
          cancellationReason: {
            reason,
            createdAt: new Date(),
          },
        }),
      };

      if (technicianNotes !== undefined) updates.technicianNotes = technicianNotes;
      if (startTime) updates.startTime = new Date(startTime);
      if (endTime) updates.endTime = new Date(endTime);

      // Marcar data de conclusão
      if (status === ServiceOrderStatus.COMPLETED) {
        updates.completedAt = new Date();
      }

      // Define quem cancelou/pausou
      if (status === ServiceOrderStatus.CANCELLED) {
        updates.cancellationReason = {
          reason,
          createdAt: new Date(),
        };
        updates.cancelledBy = { uid: user.uid, name: user.name ?? 'Desconhecido' };
      }

      if (status.toUpperCase() === ServiceOrderStatus.PAUSED.toUpperCase()) {
        updates.pauseReason = reason || '';
        updates.pausedBy = {
          uid: user.uid,
          name: user.name ?? 'Desconhecido',
        };
      }

      // ✅ Técnico assume a OS se iniciar
      if (
        !serviceOrder.technicianId &&
        serviceOrder.status === ServiceOrderStatus.OPEN &&
        status === ServiceOrderStatus.IN_PROGRESS &&
        isTechnician
      ) {
        updates.technicianId = user.uid;
        updates.technicianName = user.name;
      }
      console.log('📌 Atualizações enviadas para Firestore:', updates);

      await serviceOrderRef.update(updates);

      // ✅ Envia notificação WhatsApp
      try {
        if (serviceOrder.userId) {
          const userDoc = await db.collection('users').doc(serviceOrder.userId).get();
          if (userDoc.exists && userDoc.data()?.phone) {
            await whatsappService.notifyStatusUpdate(
              { ...serviceOrder, ...updates } as ServiceOrder,
              userDoc.data()?.phone
            );

            if (status === ServiceOrderStatus.COMPLETED) {
              await whatsappService.requestFeedback(
                { ...serviceOrder, ...updates } as ServiceOrder,
                userDoc.data()?.phone
              );
            }
          }
        }
      } catch (err) {
        console.error('Erro ao enviar notificação WhatsApp:', err);
      }

      const updatedSnapshot = await serviceOrderRef.get();

      return res.status(200).json({
        message: 'Status atualizado com sucesso',
        serviceOrder: {
          id: updatedSnapshot.id,
          ...updatedSnapshot.data(),
        },
      });
    } catch (error) {
      console.error('Erro ao atualizar status da ordem:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async assignSelfToOrder(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const user = req.user;

      if (!user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }
      console.log('📌 Dados recebidos para assign-self:', req.user, req.params.id);

      const serviceOrderDoc = db.collection('serviceOrders').doc(id);
      const serviceOrderSnapshot = await serviceOrderDoc.get();

      if (!serviceOrderSnapshot.exists) {
        return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
      }

      const serviceOrder = serviceOrderSnapshot.data();

      if (!serviceOrder) {
        return res.status(404).json({ error: 'Dados da ordem de serviço não encontrados' });
      }

      if (serviceOrder.technicianId) {
        return res.status(400).json({ error: 'Ordem já está atribuída a um técnico' });
      }

      await serviceOrderDoc.update({
        technicianId: user.uid,
        technicianName: user.name || '', // <-- Agora salva o nome
        updatedAt: new Date(),
      });

      const updatedDoc = await serviceOrderDoc.get();

      return res.status(200).json({
        message: 'Ordem atribuída ao técnico com sucesso',
        serviceOrder: { id: updatedDoc.id, ...updatedDoc.data() },
      });
    } catch (error) {
      console.error('Erro ao atribuir ordem ao técnico:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getMonthlyServiceOrderStats(req: AuthRequest, res: Response) {
    try {
      const user = req.user;
      if (!user) return res.status(401).json({ error: 'Não autenticado' });

      let { establishmentId, technicianId } = req.query as {
        establishmentId?: string;
        technicianId?: string;
      };

      // Usuário final só pode ver seu próprio estabelecimento
      if (user.userType === UserType.END_USER) {
        establishmentId = user.establishmentId ?? undefined; // garante que não vira null
        technicianId = undefined; // bloqueia filtro por técnico
      }

      // Técnico só pode ver suas próprias estatísticas (ignorar technicianId da query)
      else if (user.userType === UserType.TECHNICIAN) {
        technicianId = user.uid;
        // Pode permitir filtrar por estabelecimento? Em geral, não precisa
        establishmentId = undefined; // Opcional
      }

      // Admin e outros tipos podem filtrar por técnico e estabelecimento (sem restrição)
      // Aqui não altera nada, aceita os parâmetros da query normalmente

      // Montar query no Firestore
      let query: FirebaseFirestore.Query = db.collection('serviceOrders');

      if (establishmentId) {
        query = query.where('establishmentId', '==', establishmentId);
      }
      if (technicianId) {
        query = query.where('technicianId', '==', technicianId);
      }

      // Criar array dos últimos 12 meses (do mais antigo para o mais recente)
      const months = Array.from({ length: 12 }, (_, i) =>
        dayjs().subtract(i, 'month').startOf('month')
      ).reverse();

      const stats = months.map((m) => ({
        month: m.format('MMM'),
        open: 0,
        assigned: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
      }));

      const snap = await query.get();

      snap.forEach((doc) => {
        const d = doc.data();
        if (!d.createdAt) return;

        const createdAt = dayjs(d.createdAt.toDate());
        const index = stats.findIndex((m) => m.month === createdAt.format('MMM'));
        if (index < 0) return;

        const status = d.status.toLowerCase();

        if (['open', 'assigned', 'in_progress'].includes(status)) {
          if (status === 'assigned') stats[index].assigned++;
          else if (status === 'in_progress') stats[index].in_progress++;
          else stats[index].open++;
        } else if (['completed', 'confirmed'].includes(status)) {
          stats[index].completed++;
        } else if (status === 'cancelled') {
          stats[index].cancelled++;
        }
      });

      return res.json({ data: stats });
    } catch (err) {
      console.error('Erro no gráfico mensal:', err);
      return res.status(500).json({ error: 'Erro ao gerar estatísticas' });
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
      if (req.user?.userType === UserType.END_USER && serviceOrder.userId !== req.user.uid) {
        return res.status(403).json({ error: 'Acesso negado' });
      }
      if (
        req.user?.userType === UserType.TECHNICIAN &&
        serviceOrder.technicianId !== req.user.uid
      ) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const updates: Partial<ServiceOrder> = {
        updatedAt: new Date(),
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
        if (
          updateData.status &&
          [ServiceOrderStatus.IN_PROGRESS, ServiceOrderStatus.COMPLETED].includes(updateData.status)
        ) {
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
        if (
          serviceOrder.status === ServiceOrderStatus.COMPLETED &&
          updateData.userFeedback &&
          updateData.userRating
        ) {
          updates.useConfimed = true;
          updates.status = ServiceOrderStatus.CONFIRMED;
        }
      }

      await serviceOrderDoc.update(updates);

      // Enviar notificação via WhatsApp se houver mudança de status
      if (updates.status && serviceOrder.userId) {
        try {
          const userDoc = await db.collection('users').doc(serviceOrder.userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            if (userData?.phone) {
              await whatsappService.notifyStatusUpdate(
                { ...serviceOrder, ...updates } as ServiceOrder,
                userData.phone
              );
            }
          }
        } catch (error) {
          console.error('Erro ao enviar notificação WhatsApp:', error);
        }
      }

      // Buscar dados atualizados
      const updatedServiceOrderSnapshot = await serviceOrderDoc.get();
      const updatedServiceOrder = {
        id: updatedServiceOrderSnapshot.id,
        ...updatedServiceOrderSnapshot.data(),
      } as ServiceOrder;

      return res.json({
        message: 'Ordem de serviço atualizada com sucesso',
        serviceOrder: updatedServiceOrder,
      });
    } catch (error) {
      console.error('Erro ao atualizar ordem de serviço:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
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
        updatedAt: new Date(),
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

      console.log('Cancelamento recebido:', { id, reason });

      const serviceOrderDoc = await db.collection('serviceOrders').doc(id);
      const serviceOrderSnapshot = await serviceOrderDoc.get();

      if (!serviceOrderSnapshot.exists) {
        return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
      }

      const serviceOrder = serviceOrderSnapshot.data() as ServiceOrder;

      // Verificar permissões
      if (req.user?.userType === UserType.END_USER && serviceOrder.userId !== req.user.uid) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      // Verificar se pode ser cancelada
      if (
        [
          ServiceOrderStatus.COMPLETED,
          ServiceOrderStatus.CONFIRMED,
          ServiceOrderStatus.CANCELLED,
        ].includes(serviceOrder.status)
      ) {
        return res.status(400).json({ error: 'Esta ordem de serviço não pode ser cancelada' });
      }

      const updates = {
        status: ServiceOrderStatus.CANCELLED,
        cancellationReason: {
          reason,
          createdAt: new Date(),
        },
        updatedAt: new Date(),
      };

      await serviceOrderDoc.update(updates);

      // Buscar o telefone do usuário para enviar notificação via WhatsApp
      try {
        if (serviceOrder.userId) {
          const userDoc = await db.collection('users').doc(serviceOrder.userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            if (userData?.phone) {
              // Enviar notificação de cancelamento via WhatsApp
              await whatsappService.notifyCancellation(
                { ...serviceOrder, ...updates } as ServiceOrder,
                userData.phone,
                reason || 'Não especificado'
              );
            }
          }
        }
      } catch (error) {
        console.error('Erro ao enviar notificação WhatsApp:', error);
        // Não interrompe o fluxo se a notificação falhar
      }

      return res.json({ message: 'Ordem de serviço cancelada com sucesso' });
    } catch (error) {
      console.error('Erro ao cancelar ordem de serviço:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getServiceOrderStats(req: AuthRequest, res: Response) {
    try {
      console.log('--- getServiceOrderStats called ---');
      const { technicianId, establishmentId } = req.query;
      const user = req.user;

      if (!user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      let query: FirebaseFirestore.Query = db.collection('serviceOrders');

      if (establishmentId) {
        query = query.where('establishmentId', '==', establishmentId);
      } else {
        if (user.userType === UserType.TECHNICIAN) {
          query = query.where('technicianId', '==', user.uid);
        } else if (user.userType === UserType.END_USER) {
          query = query.where('userId', '==', user.uid);
        }
      }

      const snapshot = await query.get();

      const stats: Record<string, number> = {
        total: 0,
        open: 0,
        assigned: 0,
        in_progress: 0,
        completed: 0,
        confirmed: 0,
        cancelled: 0,
      };

      snapshot.forEach((doc) => {
        const order = doc.data();
        const statusKey = (order.status || '').toLowerCase();
        stats.total++;
        if (statusKey && stats.hasOwnProperty(statusKey)) {
          stats[statusKey]++;
        }
      });

      return res.json({ stats });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return res.status(500).json({ error: 'Erro ao buscar estatísticas de ordens de serviço' });
    }
  }
  async getMonthlyStats(req: AuthRequest, res: Response) {
    try {
      console.log('--- getMonthlyStats called ---');
      const user = req.user;

      if (!user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      // Últimos 12 meses
      const now = new Date();
      const months: { month: string; assigned: number; in_progress: number; completed: number }[] =
        [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = date.toLocaleString('pt-BR', { month: 'short' });
        months.push({ month: monthName, assigned: 0, in_progress: 0, completed: 0 });
      }

      let query: FirebaseFirestore.Query = db.collection('serviceOrders');

      if (user.userType === UserType.TECHNICIAN) {
        query = query.where('technicianId', '==', user.uid);
      } else if (user.userType === UserType.END_USER) {
        query = query.where('userId', '==', user.uid);
      }

      const snapshot = await query.get();

      snapshot.forEach((doc) => {
        const order = doc.data();
        const createdAt = order.createdAt?.toDate
          ? order.createdAt.toDate()
          : new Date(order.createdAt);
        const status = (order.status || '').toLowerCase();
        const monthIndex = months.findIndex(
          (m) => m.month === createdAt.toLocaleString('pt-BR', { month: 'short' })
        );

        if (monthIndex !== -1) {
          if (status === 'assigned') months[monthIndex].assigned++;
          if (status === 'in_progress') months[monthIndex].in_progress++;
          if (status === 'completed') months[monthIndex].completed++;
        }
      });

      return res.json({ monthlyData: months });
    } catch (error) {
      console.error('Erro ao buscar estatísticas mensais:', error);
      return res.status(500).json({ error: 'Erro ao buscar estatísticas mensais' });
    }
  }

  async updateAllServiceOrdersHandler(req: Request, res: Response) {
    try {
      const snapshot = await db.collection('serviceOrders').get();
      const batch = db.batch();

      snapshot.forEach((doc) => {
        const data = doc.data();
        const updatedData: any = {};

        // Campos a padronizar
        if (data.status) updatedData.status = data.status.toLowerCase();
        if (data.priority) updatedData.priority = data.priority.toLowerCase();
        if (data.title) updatedData.title = data.title.toLowerCase();
        if (data.description) updatedData.description = data.description.toLowerCase();
        if (data.establishmentName)
          updatedData.establishmentName = data.establishmentName.toLowerCase();
        if (data.technicianName) updatedData.technicianName = data.technicianName.toLowerCase();
        if (data.userName) updatedData.userName = data.userName.toLowerCase();

        batch.update(doc.ref, updatedData);
      });

      await batch.commit();
      return res.json({ message: `Atualizados ${snapshot.size} documentos para lowercase` });
    } catch (error) {
      console.error('Erro ao atualizar ordens:', error);
      return res.status(500).json({ error: 'Erro interno ao atualizar registros' });
    }
  }
}
