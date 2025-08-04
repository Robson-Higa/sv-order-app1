import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { AuthRequest, UserType } from '../types';

export class EstablishmentController {
  async getAllEstablishments(req: AuthRequest, res: Response) {
    try {
      const snapshot = await db.collection('establishments').get();
      const establishments = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          let responsibleName = null;

          if (data.responsibleId) {
            const userSnap = await db.collection('users').doc(data.responsibleId).get();
            if (userSnap.exists) {
              const userData = userSnap.data();
              responsibleName = userData?.name || null;
            }
          }

          return {
            id: doc.id,
            ...data,
            responsibleName,
          };
        })
      );

      return res.status(200).json({ establishments });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao buscar estabelecimentos.' });
    }
  }

 // controllers/EstablishmentController.ts
async createEstablishment(req: Request, res: Response) {
  try {
    const { name, sectors = [] } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    const docRef = await db.collection('establishments').add({
      name,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // ✅ Cria setores como subcoleção
    for (const sector of sectors) {
      if (sector && sector.trim()) {
        await db.collection('establishments')
          .doc(docRef.id)
          .collection('sectors')
          .add({
            name: sector.trim(),
            createdAt: new Date(),
          });
      }
    }

    return res.status(201).json({ id: docRef.id, name, sectors });
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
      const { name, responsibleId } = req.body;

      const docRef = db.collection('establishments').doc(id);
      const doc = await docRef.get();
      if (!doc.exists) return res.status(404).json({ error: 'Estabelecimento não encontrado.' });

      const updates: any = {};
      if (name) updates.name = name;
      if (responsibleId !== undefined) updates.responsibleId = responsibleId;

      await docRef.update(updates);
      return res.status(200).json({ message: 'Estabelecimento atualizado com sucesso.' });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao atualizar estabelecimento.' });
    }
  }

  async deleteEstablishment(req: AuthRequest, res: Response) {
    try {
      if (req.user?.userType !== UserType.ADMIN) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const { id } = req.params;
      await db.collection('establishments').doc(id).delete();
      return res.status(200).json({ message: 'Estabelecimento deletado com sucesso.' });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao deletar estabelecimento.' });
    }
  }

  async deactivateEstablishment(req: AuthRequest, res: Response) {
    try {
      if (req.user?.userType !== UserType.ADMIN) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const { id } = req.params;
      await db.collection('establishments').doc(id).update({ isActive: false });
      return res.status(200).json({ message: 'Estabelecimento desativado.' });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao desativar estabelecimento.' });
    }
  }

  async activateEstablishment(req: AuthRequest, res: Response) {
    try {
      if (req.user?.userType !== UserType.ADMIN) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const { id } = req.params;
      await db.collection('establishments').doc(id).update({ isActive: true });
      return res.status(200).json({ message: 'Estabelecimento ativado.' });
    } catch (error) {
      return res.status(500).json({ error: 'Erro ao ativar estabelecimento.' });
    }
  }
  async getEstablishmentStats(req: AuthRequest, res: Response) {
  try {
    if (req.user?.userType !== UserType.ADMIN) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const snapshot = await db.collection('establishments').get();

    let total = 0;
    let active = 0;
    let inactive = 0;

    snapshot.forEach((doc) => {
      total++;
      const data = doc.data();
      if (data.isActive) active++;
      else inactive++;
    });

    return res.status(200).json({
      stats: {
        totalEstablishments: total,
        activeEstablishments: active,
        inactiveEstablishments: inactive,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar estatísticas.' });
  }
}
async getEstablishmentById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const docRef = db.collection('establishments').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Estabelecimento não encontrado.' });
    }

    const data = doc.data();
    let responsibleName = null;

    if (data?.responsibleId) {
      const userSnap = await db.collection('users').doc(data.responsibleId).get();
      if (userSnap.exists) {
        responsibleName = userSnap.data()?.name || null;
      }
    }

    return res.status(200).json({
      id: doc.id,
      ...data,
      responsibleName,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar estabelecimento.' });
  }
}

}
