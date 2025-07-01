import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { Establishment, UserType, AuthRequest } from '../types';
import { generateId } from '../utils/helpers';

export class EstablishmentController {
 async getAllEstablishments(req: AuthRequest, res: Response) {
  try {
    const establishmentsRef = db.collection('establishments');
    const snapshot = await establishmentsRef
      .where('isActive', '==', true)
      .orderBy('name')
      .get();

    const establishments = snapshot.docs.map(doc => {
      const data = doc.data();

      return {
        id: doc.id,
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        isActive: data.isActive,
        createdAt: data.createdAt
          ? new Date(data.createdAt._seconds * 1000).toISOString()
          : null,
        updatedAt: data.updatedAt
          ? new Date(data.updatedAt._seconds * 1000).toISOString()
          : null,
      };
    });

    res.json({ establishments });
  } catch (error) {
    console.error('Erro ao buscar estabelecimentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }

  }

  async getEstablishmentById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const establishmentDoc = await db.collection('establishment').doc(id).get();

      if (!establishmentDoc.exists) {
        return res.status(404).json({ error: 'Estabelecimento não encontrado' });
      }

      const establishment = {
        id: establishmentDoc.id,
        ...establishmentDoc.data()
      } as Establishment;

      return res.json({ establishment });
    } catch (error) {
      console.error('Erro ao buscar estabelecimento:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async createEstablishment(req: AuthRequest, res: Response) {
    try {
      if (req.user?.userType !== UserType.ADMIN) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const { name, address, phone, email } = req.body;

      // Verificar se já existe um estabelecimento com o mesmo nome
      const existingEstablishment = await db.collection('establishments')
        .where('name', '==', name)
        .where('isActive', '==', true)
        .get();

      if (!existingEstablishment.empty) {
        return res.status(400).json({ error: 'Já existe um estabelecimento com este nome' });
      }

      const establishmentId = generateId();
      const newEstablishment: Establishment = {
        id: establishmentId,
        name,
        address,
        phone,
        email,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
      };

      await db.collection('establishments').doc(establishmentId).set(newEstablishment);

      return res.status(201).json({
        message: 'Estabelecimento criado com sucesso',
        establishment: newEstablishment
      });
    } catch (error) {
      console.error('Erro ao criar estabelecimento:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async updateEstablishment(req: AuthRequest, res: Response) {
    try {
      if (req.user?.userType !== UserType.ADMIN) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const { id } = req.params;
      const { name, address, phone, email } = req.body;

      const establishmentDoc = await db.collection('establishments').doc(id);
      const establishmentSnapshot = await establishmentDoc.get();

      if (!establishmentSnapshot.exists) {
        return res.status(404).json({ error: 'Estabelecimento não encontrado' });
      }

      // Verificar se o novo nome já está em uso por outro estabelecimento
      if (name) {
        const existingEstablishment = await db.collection('establishments')
          .where('name', '==', name)
          .where('isActive', '==', true)
          .get();

        const conflictingEstablishment = existingEstablishment.docs.find((doc: { id: string; }) => doc.id !== id);
        if (conflictingEstablishment) {
          return res.status(400).json({ error: 'Já existe um estabelecimento com este nome' });
        }
      }

      const updateData: Partial<Establishment> = {
        updatedAt: new Date()
      };

      if (name) updateData.name = name;
      if (address) updateData.address = address;
      if (phone !== undefined) updateData.phone = phone;
      if (email !== undefined) updateData.email = email;

      await establishmentDoc.update(updateData);

      // Buscar dados atualizados
      const updatedEstablishmentSnapshot = await establishmentDoc.get();
      const updatedEstablishment = {
        id: updatedEstablishmentSnapshot.id,
        ...updatedEstablishmentSnapshot.data()
      } as Establishment;

      return res.json({
        message: 'Estabelecimento atualizado com sucesso',
        establishment: updatedEstablishment
      });
    } catch (error) {
      console.error('Erro ao atualizar estabelecimento:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async deleteEstablishment(req: AuthRequest, res: Response) {
    try {
      if (req.user?.userType !== UserType.ADMIN) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const { id } = req.params;

      const establishmentDoc = await db.collection('establishments').doc(id);
      const establishmentSnapshot = await establishmentDoc.get();

      if (!establishmentSnapshot.exists) {
        return res.status(404).json({ error: 'Estabelecimento não encontrado' });
      }

      // Verificar se há usuários associados ao estabelecimento
      const usersSnapshot = await db.collection('users')
        .where('establishmentId', '==', id)
        .where('isActive', '==', true)
        .limit(1)
        .get();

      if (!usersSnapshot.empty) {
        return res.status(400).json({ 
          error: 'Não é possível excluir estabelecimento com usuários associados. Desative o estabelecimento em vez disso.' 
        });
      }

      // Verificar se há ordens de serviço associadas ao estabelecimento
      const serviceOrdersSnapshot = await db.collection('serviceOrders')
        .where('establishmentId', '==', id)
        .limit(1)
        .get();

      if (!serviceOrdersSnapshot.empty) {
        return res.status(400).json({ 
          error: 'Não é possível excluir estabelecimento com ordens de serviço associadas. Desative o estabelecimento em vez disso.' 
        });
      }

      await establishmentDoc.delete();

      return res.json({ message: 'Estabelecimento excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir estabelecimento:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async deactivateEstablishment(req: AuthRequest, res: Response) {
    try {
      if (req.user?.userType !== UserType.ADMIN) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const { id } = req.params;

      const establishmentDoc = await db.collection('establishments').doc(id);
      const establishmentSnapshot = await establishmentDoc.get();

      if (!establishmentSnapshot.exists) {
        return res.status(404).json({ error: 'Estabelecimento não encontrado' });
      }

      await establishmentDoc.update({
        isActive: false,
        updatedAt: new Date()
      });

      return res.json({ message: 'Estabelecimento desativado com sucesso' });
    } catch (error) {
      console.error('Erro ao desativar estabelecimento:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async activateEstablishment(req: AuthRequest, res: Response) {
    try {
      if (req.user?.userType !== UserType.ADMIN) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const { id } = req.params;

      const establishmentDoc = await db.collection('establishments').doc(id);
      const establishmentSnapshot = await establishmentDoc.get();

      if (!establishmentSnapshot.exists) {
        return res.status(404).json({ error: 'Estabelecimento não encontrado' });
      }

      await establishmentDoc.update({
        isActive: true,
        updatedAt: new Date()
      });

      return res.json({ message: 'Estabelecimento ativado com sucesso' });
    } catch (error) {
      console.error('Erro ao ativar estabelecimento:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getEstablishmentStats(req: AuthRequest, res: Response) {
    try {
      if (req.user?.userType !== UserType.ADMIN) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const establishmentsRef = db.collection('establishments');
      
      const [activeSnapshot, totalSnapshot] = await Promise.all([
        establishmentsRef.where('isActive', '==', true).get(),
        establishmentsRef.get()
      ]);

      const stats = {
        totalEstablishments: totalSnapshot.size,
        activeEstablishments: activeSnapshot.size,
        inactiveEstablishments: totalSnapshot.size - activeSnapshot.size
      };

      res.json({ stats });
      return;
    } catch (error) {
      console.error('Erro ao buscar estatísticas de estabelecimentos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
      return;
    }
  }
}

