import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { User, UserType, AuthRequest } from '../types';
import { sanitizeUser, generateId, hashPassword } from '../utils/helpers';
import { UserFirestore } from '../types';
import { Timestamp } from 'firebase-admin/firestore';
import * as admin from 'firebase-admin'; 

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
        return sanitizeUser(userData);
      });

      return res.json({ users });
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async getUserById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      // Verificar permissões
      if (req.user?.userType !== UserType.ADMIN && req.user?.uid !== id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const userDoc = await db.collection('users').doc(id).get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const userData = userDoc.data() as User;
      return res.json({ user: sanitizeUser(userData) });
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

async getUsersByType(req: AuthRequest, res: Response) {
  try {
    const { userType: rawType } = req.params;
    const userType = rawType?.toLowerCase() as UserType;

    if (req.user?.userType !== UserType.ADMIN) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

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
      if (req.user?.userType !== UserType.ADMIN) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const usersRef = db.collection('users');
      const snapshot = await usersRef
        .where('userType', '==', UserType.TECHNICIAN)
        .where('isActive', '==', true)
        .orderBy('name')
        .get();

      const technicians = snapshot.docs.map(doc => {
        const userData = doc.data() as User;
        return sanitizeUser(userData);
      });

      res.json({ technicians });
      return;
    } catch (error) {
      console.error('Erro ao buscar técnicos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
      return;
    }
  }
async createUser(req: AuthRequest, res: Response) {
  // Verificação de permissões
  if (req.user?.userType !== UserType.ADMIN) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  // Validação de entrada
  const { name, email, password, phone, userType } = req.body;
  if (!name || !email || !password || !userType) {
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });
  }

  try {
    // 1. Criar usuário no Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
      phoneNumber: phone,
      disabled: false,
    });

    // 2. Definir custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      userType,
      isActive: true,
    });

    // 3. Preparar dados para o Firestore
    const userFirestoreData: UserFirestore = {
      uid: userRecord.uid,
      name,
      email,
      phone: phone || null,
      userType,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // 4. Salvar no Firestore
    await db.collection('users').doc(userRecord.uid).set(userFirestoreData);

    // 5. Recuperar os dados para garantir os timestamps
    const doc = await db.collection('users').doc(userRecord.uid).get();
    const userData = doc.data() as UserFirestore;

    // 6. Converter para o tipo User
    const userResponse: User = {
      ...userData,
      uid: userRecord.uid,
      createdAt: (userData.createdAt as Timestamp).toDate(),
      updatedAt: (userData.updatedAt as Timestamp).toDate(),
    };

    return res.status(201).json({ user: sanitizeUser(userResponse) });
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
      const { name, email, establishmentId, isActive } = req.body;

      // Verificar permissões
      if (req.user?.userType !== UserType.ADMIN && req.user?.uid !== id) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      const userDoc = await db.collection('users').doc(id);
      const userSnapshot = await userDoc.get();

      if (!userSnapshot.exists) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const updateData: Partial<User> = {
        updatedAt: new Date()
      };

      if (name) updateData.name = name;
      if (email) {
        // Verificar se o email já está em uso por outro usuário
        const emailCheck = await db.collection('users')
          .where('email', '==', email)
          .where('id', '!=', id)
          .get();
        
        if (!emailCheck.empty) {
          return res.status(400).json({ error: 'Email já está em uso' });
        }
        updateData.email = email;
      }
      if (establishmentId !== undefined) updateData.establishmentId = establishmentId;
      
      // Apenas admins podem alterar o status ativo
      if (req.user?.userType === UserType.ADMIN && isActive !== undefined) {
        updateData.isActive = isActive;
      }

      await userDoc.update(updateData);

      // Buscar dados atualizados
      const updatedUserSnapshot = await userDoc.get();
      const updatedUserData = updatedUserSnapshot.data() as User;

      return res.json({
        message: 'Usuário atualizado com sucesso',
        user: sanitizeUser(updatedUserData)
      });
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

      const userDoc = db.collection('users').doc(id);
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

      const userDoc = db.collection('users').doc(id);
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

     const userDoc = db.collection('users').doc(id);
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
}

