import { Request, Response } from 'express';
import storage, { db} from '../config/firebase';

import { User, UserType, AuthRequest } from '../types';
import { sanitizeUser, generateId, hashPassword } from '../utils/helpers';
import multer from 'multer';
import * as admin from 'firebase-admin'; 

import fs from 'fs';
import path from 'path';

export class UserController {
async getAllUsers(req: AuthRequest, res: Response) {
  try {
    if (req.user?.userType !== UserType.ADMIN) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const usersRef = db.collection('users');
    const snapshot = await usersRef.orderBy('createdAt', 'desc').get();

    const users = snapshot.docs.map(doc => {
      const userData = doc.data() as User;
      return sanitizeUser({ ...userData, uid: doc.id });
    });

    return res.json({ users });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
async uploadAvatar(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { avatarBase64 } = req.body;

    if (!avatarBase64) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }

    // Atualizar documento do usuário com o Base64
    await db.collection('users').doc(id).update({
      avatarBase64,
      updatedAt: new Date()
    });

    return res.json({ message: 'Avatar atualizado com sucesso', avatarBase64 });
  } catch (error) {
    console.error('Erro ao salvar avatar:', error);
    return res.status(500).json({ error: 'Erro interno ao salvar avatar' });
  }
}

async getUserById(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;

    // Verificar permissões: Admin ou o próprio usuário
    if (req.user?.userType !== UserType.ADMIN && req.user?.uid !== id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const userDoc = await db.collection('users').doc(id).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const userData = userDoc.data() as User;

    const sanitizedUser = {
      ...sanitizeUser(userData),
      uid: userDoc.id,
      avatarUrl: userData.avatarUrl || null, // garante que venha mesmo se não existir
    };

    return res.json({ user: sanitizedUser });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async getUsersByType(req: AuthRequest, res: Response) {
  try {
    const { userType: rawType } = req.params;
    const userType = rawType?.toLowerCase() as UserType;

    // Verificar permissão do admin
    if ((req.user?.userType || '').toLowerCase() !== UserType.ADMIN) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Validar tipo
    if (!Object.values(UserType).includes(userType)) {
      return res.status(400).json({ error: 'Tipo de usuário inválido' });
    }

    const usersRef = db.collection('users');
    const snapshot = await usersRef
      .where('userType', '==', userType)
      .where('isActive', '==', true)
      .orderBy('name')
      .get();

    const users = snapshot.docs.map(doc => {
      const userData = doc.data() as User;
      return sanitizeUser(userData);
    });

    return res.json({ users });
  } catch (error) {
    console.error('Erro ao buscar usuários por tipo:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

  async getTechnicians(req: AuthRequest, res: Response) {
  try {
    // Normaliza tipo do usuário logado
    if ((req.user?.userType || '').toLowerCase() !== UserType.ADMIN) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const usersRef = db.collection('users');
    const snapshot = await usersRef
      .where('userType', '==', UserType.TECHNICIAN) // já é 'technician'
      .where('isActive', '==', true)
      .orderBy('name')
      .get();

    const technicians = snapshot.docs.map(doc => {
      const userData = doc.data() as User;
      return sanitizeUser({ ...userData, uid: doc.id });
    });

    return res.json({ technicians });
  } catch (error) {
    console.error('Erro ao buscar técnicos:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async createUser(req: AuthRequest, res: Response) {
  if (req.user?.userType !== UserType.ADMIN) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const { name, email, password, phone, userType, establishmentId } = req.body;

  if (!name || !email || !password || !userType) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  if (userType === UserType.END_USER && !establishmentId) {
    return res.status(400).json({ error: 'Usuário final precisa de um estabelecimento' });
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
      phoneNumber: phone || undefined,
      disabled: false,
    });

    // URL pública do avatar padrão
    const avatarUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/images/avatarPadrao.webp`;

    const userData: User = {
      uid: userRecord.uid,
      name,
      email,
      phone,
      userType,
      isActive: true,
      establishmentId: userType === UserType.END_USER ? establishmentId : null,
      createdAt: new Date(),
      updatedAt: new Date(),
      avatarUrl,
    };

    await db.collection('users').doc(userRecord.uid).set(userData);

    return res.status(201).json({ user: sanitizeUser(userData) });
  } catch (error: any) {
    console.error('Erro ao criar usuário:', error);
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}


async updateUser(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { name, email, phone, userType, avatarUrl } = req.body;

    // Permissão: Admin ou dono do perfil
    if (req.user?.userType !== UserType.ADMIN && req.user?.uid !== id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const userRef = db.collection('users').doc(id);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const updates: any = {
      updatedAt: new Date(),
    };

    if (name) updates.name = name;
    if (email) updates.email = email;
    if (phone) updates.phone = phone;
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl; // aceita vazio ou base64
    if (req.user?.userType === UserType.ADMIN && userType) {
      updates.userType = userType; // apenas admin pode mudar tipo
    }

    await userRef.update(updates);

    return res.json({ message: 'Usuário atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

  async deactivateUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (req.user?.userType !== UserType.ADMIN) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      if (req.user.uid === id) {
        return res.status(400).json({ error: 'Você não pode desativar sua própria conta' });
      }

      const userDoc = await db.collection('users').doc(id);
      const userSnapshot = await userDoc.get();

      if (!userSnapshot.exists) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      await userDoc.update({
        isActive: false,
        updatedAt: new Date()
      });

      return res.json({ message: 'Usuário desativado com sucesso' });
    } catch (error) {
      console.error('Erro ao desativar usuário:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async activateUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (req.user?.userType !== UserType.ADMIN) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const userDoc = await db.collection('users').doc(id);
      const userSnapshot = await userDoc.get();

      if (!userSnapshot.exists) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      await userDoc.update({
        isActive: true,
        updatedAt: new Date()
      });

      return res.json({ message: 'Usuário ativado com sucesso' });
    } catch (error) {
      console.error('Erro ao ativar usuário:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async deleteUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (req.user?.userType !== UserType.ADMIN) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      if (req.user.uid === id) {
        return res.status(400).json({ error: 'Você não pode excluir sua própria conta' });
      }

      const userDoc = await db.collection('users').doc(id);
      const userSnapshot = await userDoc.get();

      if (!userSnapshot.exists) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Verificar se o usuário tem ordens de serviço associadas
      const serviceOrdersSnapshot = await db.collection('serviceOrders')
        .where('userId', '==', id)
        .limit(1)
        .get();

      if (!serviceOrdersSnapshot.empty) {
        return res.status(400).json({ 
          error: 'Não é possível excluir usuário com ordens de serviço associadas. Desative o usuário em vez disso.' 
        });
      }

      await userDoc.delete();

      return res.json({ message: 'Usuário excluído com sucesso' });
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  

  async getUserStats(req: AuthRequest, res: Response) {
    try {
      if (req.user?.userType !== UserType.ADMIN) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const usersRef = db.collection('users');
      
      // Contar usuários por tipo
      const [adminSnapshot, technicianSnapshot, endUserSnapshot] = await Promise.all([
        usersRef.where('userType', '==', UserType.ADMIN).where('isActive', '==', true).get(),
        usersRef.where('userType', '==', UserType.TECHNICIAN).where('isActive', '==', true).get(),
        usersRef.where('userType', '==', UserType.END_USER).where('isActive', '==', true).get()
      ]);

      const stats = {
        totalUsers: adminSnapshot.size + technicianSnapshot.size + endUserSnapshot.size,
        admins: adminSnapshot.size,
        technicians: technicianSnapshot.size,
        endUsers: endUserSnapshot.size,
        activeUsers: adminSnapshot.size + technicianSnapshot.size + endUserSnapshot.size
      };

      res.json({ stats });
      return;
    } catch (error) {
      console.error('Erro ao buscar estatísticas de usuários:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
      return;
    }
  }

  async getProfile(req: AuthRequest, res: Response) {
    if (!req.user) return res.status(401).json({ error: 'Não autenticado' });
    // Busque o usuário pelo req.user.uid
    const userDoc = await db.collection('users').doc(req.user.uid).get();
    if (!userDoc.exists) return res.status(404).json({ error: 'Usuário não encontrado' });
    return res.json({ user: userDoc.data() });
  }

  async getCurrentUser(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const userDoc = await db.collection('users').doc(req.user.uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const userData = userDoc.data() as User;

    const sanitizedUser = {
      ...sanitizeUser(userData),
      uid: userDoc.id,
      avatarUrl: userData.avatarUrl || null, // ✅ Inclui avatar mesmo se não existir
    };

    return res.json({ user: sanitizedUser });
  } catch (error) {
    console.error('Erro ao buscar usuário atual:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

};

