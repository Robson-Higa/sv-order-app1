import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { ServiceOrder, ServiceOrderStatus, UserType, Priority, AuthRequest, CreateServiceOrderRequest, UpdateServiceOrderRequest } from '../types';
import { generateId, generateOrderNumber } from '../utils/helpers';
import { Query } from 'firebase-admin/firestore';

export class ServiceOrderController {
 async getAllServiceOrders(req: AuthRequest, res: Response) {
  try {
    const { status, priority, technicianId, establishmentId, scope } = req.query;
    const user = req.user;

    console.log('📌 [ServiceOrders] Requisição recebida');
    console.log('➡ Filtros recebidos:', { status, priority, technicianId, establishmentId, scope });
    console.log('➡ Usuário autenticado:', {
      uid: user?.uid,
      userType: user?.userType,
      establishmentId: user?.establishmentId,
      name: user?.name
    });

    let query: FirebaseFirestore.Query = db.collection('serviceOrders');

    if (status) {
      console.log(`📌 Aplicando filtro status: ${status}`);
      query = query.where('status', '==', status);
    }

    if (priority) {
      console.log(`📌 Aplicando filtro priority: ${priority}`);
      query = query.where('priority', '==', priority);
    }

    if (technicianId) {
      console.log(`📌 Aplicando filtro technicianId: ${technicianId}`);
      query = query.where('technicianId', '==', technicianId);
    }

   if (req.user?.userType === UserType.ADMIN && establishmentId) {
  // Admin pode ver qualquer estabelecimento
  query = query.where('establishmentId', '==', establishmentId);
} else if (req.user?.userType === UserType.END_USER) {
  // Usuário final vê todas do seu estabelecimento
  query = query.where('establishmentId', '==', req.user.establishmentId);
} else if (req.user?.userType === UserType.TECHNICIAN) {
  // Técnico também vê todas do seu estabelecimento
  query = query.where('establishmentId', '==', req.user.establishmentId);
}


    console.log('📌 Executando query no Firestore...');

    const ordersSnap = await query.get();
    console.log(`📌 Total de ordens encontradas: ${ordersSnap.size}`);

    const orders = ordersSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('📌 Dados das ordens enviadas para o frontend:', JSON.stringify(orders, null, 2));

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
        ...serviceOrderDoc.data()
      } as ServiceOrder;

      // Verificar permissões
      if (req.user?.userType === UserType.END_USER && serviceOrder.userId !== req.user.uid) {
        return res.status(403).json({ error: 'Acesso negado' });
      }
      if (req.user?.userType === UserType.TECHNICIAN && serviceOrder.technicianId !== req.user.uid) {
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
    if (!title || !description || !establishmentName || !priority) {
      return res.status(400).json({
        error: 'Campos obrigatórios: title, description, establishmentName, priority'
      });
    }

    // Buscar ou criar estabelecimento pelo nome
    let establishmentId: string | undefined;
    const establishmentDoc = await db.collection('establishments')
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
      const technicianDoc = await db.collection('users')
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

    // Criar objeto sem campos undefined
    const newServiceOrder: Record<string, any> = {
      id: serviceOrderId,
      orderNumber,
      title,
      description,
      priority,
      establishmentId,
      establishmentName,
      userId,
      userName,
      status: ServiceOrderStatus.OPEN,
      createdAt: new Date(),
      updatedAt: new Date(),
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null
    };

    if (technicianId) {
      newServiceOrder.technicianId = technicianId;
      newServiceOrder.technicianName = technicianName;
    }

    await db.collection('serviceOrders').doc(serviceOrderId).set(newServiceOrder);

    return res.status(201).json({
      message: 'Ordem de serviço criada com sucesso',
      serviceOrder: newServiceOrder
    });
  } catch (error) {
    console.error('Erro ao criar ordem de serviço:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : error
    });
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
      if (req.user?.userType === UserType.TECHNICIAN && serviceOrder.technicianId !== req.user.uid) {
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
      if (req.user?.userType === UserType.END_USER && serviceOrder.userId !== req.user.uid) {
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
    console.log('--- getServiceOrderStats called ---');
    console.log('User:', req.user);
    console.log('Query params:', req.query);

    const { establishmentId } = req.query;
    const user = req.user;

    if (!user) {
      console.log('Usuário não autenticado');
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection('serviceOrders');

    if (establishmentId) {
      console.log(`Filtrando ordens pelo establishmentId: ${establishmentId}`);
      query = query.where('establishmentId', '==', establishmentId);
    } else {
      console.log(`Sem establishmentId. Aplicando filtro padrão para userType: ${user.userType}`);
      if (user.userType === 'admin') {
        // Admin vê tudo (sem filtro)
        console.log('Usuário admin - sem filtro de ordens');
      } else if (user.userType === 'technician') {
        console.log(`Usuário técnico - filtrando ordens do technicianId: ${user.uid}`);
        query = query.where('technicianId', '==', user.uid);
      } else {
        console.log(`Usuário final - filtrando ordens do userId: ${user.uid}`);
        query = query.where('userId', '==', user.uid);
      }
    }

    const snapshot = await query.get();
    console.log(`Total de ordens encontradas: ${snapshot.size}`);

    const stats = {
      total: 0,
      open: 0,
      assigned: 0,
      inProgress: 0,
      completed: 0,
      confirmed: 0,
      cancelled: 0,
    };

    snapshot.forEach((doc) => {
      const order = doc.data();
      console.log(`Ordem: ${doc.id} - Status: ${order.status}`);
      stats.total++;
      if (stats[order.status as keyof typeof stats] !== undefined) {
        stats[order.status as keyof typeof stats]++;
      }
    });

    console.log('Estatísticas finais:', stats);

    return res.json({ stats });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return res.status(500).json({ error: 'Erro ao buscar estatísticas de ordens de serviço' });
  }
}

}

