import { Request, Response } from 'express';
import { auth, db } from '../config/firebase';
import { User, UserType, LoginRequest, RegisterRequest, AuthRequest } from '../types';
import {
  hashPassword,
  comparePassword,
  generateToken,
  sanitizeUser,
  generateId,
} from '../utils/helpers';
import { verifyToken } from '../utils/helpers'; // ajuste o caminho

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { idToken } = req.body;
      console.log('Login recebido, idToken:', idToken);

      if (!idToken) {
        return res.status(400).json({ error: 'Token de autenticação ausente' });
      }

      const decodedToken = await auth.verifyIdToken(idToken);
      const { uid, email } = decodedToken;

      if (!email) {
        return res.status(400).json({ error: 'Token inválido: email não encontrado' });
      }

      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('email', '==', email).get();

      if (snapshot.empty) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data() as User;

      if (!userData.isActive) {
        return res
          .status(403)
          .json({ error: 'Conta desativada. Entre em contato com o administrador.' });
      }

      const token = generateToken(userData);

      await userDoc.ref.update({
        lastLogin: new Date(),
        updatedAt: new Date(),
      });

      return res.json({
        message: 'Login realizado com sucesso',
        token,
        user: sanitizeUser(userData),
      });
    } catch (error) {
      console.error('Erro no login com Firebase ID Token:', error);
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
  }

  async verifyTokenString(token: string) {
    try {
      const decoded = await verifyToken(token); // Partial<User> | null

      if (!decoded || !decoded.uid) return null; // checa se decoded e decoded.uid existem

      const userDoc = await db.collection('users').doc(decoded.uid).get();
      if (!userDoc.exists) return null;

      const userData = userDoc.data() as User;
      return userData;
    } catch (error) {
      console.error('Erro ao verificar token:', error);
      return null;
    }
  }

  async register(req: Request, res: Response) {
    try {
      console.log('Dados recebidos no register:', req.body);

      const { idToken, name, userType, phone, establishmentId } = req.body;

      if (!idToken || !name || !userType) {
        return res.status(400).json({ error: 'Dados obrigatórios ausentes' });
      }

      const decodedToken = await auth.verifyIdToken(idToken);
      const { uid, email } = decodedToken;

      if (!email) {
        return res.status(400).json({ error: 'Email inválido no token' });
      }

      const userDoc = await db.collection('users').doc(uid).get();
      if (userDoc.exists) {
        return res.status(400).json({ error: 'Usuário já existe' });
      }

      const userData: User = {
        uid,
        email,
        name,
        userType,
        phone,
        establishmentId: establishmentId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      await db.collection('users').doc(uid).set(userData);

      return res.status(201).json({
        message: 'Usuário registrado com sucesso',
        user: sanitizeUser(userData),
      });
    } catch (error) {
      console.error('Erro no registro:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async registerAdmin(req: AuthRequest, res: Response) {
    try {
      const { email, password, name }: RegisterRequest = req.body;

      if (req.user?.userType !== UserType.ADMIN) {
        return res
          .status(403)
          .json({ error: 'Apenas administradores podem criar outros administradores' });
      }

      const usersRef = db.collection('users');
      const existingUser = await usersRef.where('email', '==', email).get();

      if (!existingUser.empty) {
        return res.status(400).json({ error: 'Email já está em uso' });
      }

      const hashedPassword = await hashPassword(password);

      const userId = generateId();
      const newAdmin: User = {
        uid: userId,
        email,
        password: hashedPassword,
        name,
        userType: UserType.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      await db.collection('users').doc(userId).set(newAdmin);

      return res.status(201).json({
        message: 'Administrador criado com sucesso',
        user: sanitizeUser(newAdmin),
      });
    } catch (error) {
      console.error('Erro ao criar administrador:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async registerTechnician(req: AuthRequest, res: Response) {
    try {
      const { email, password, name, establishmentId }: RegisterRequest = req.body;

      if (req.user?.userType !== UserType.ADMIN) {
        return res.status(403).json({ error: 'Apenas administradores podem criar técnicos' });
      }

      const usersRef = db.collection('users');
      const existingUser = await usersRef.where('email', '==', email).get();

      if (!existingUser.empty) {
        return res.status(400).json({ error: 'Email já está em uso' });
      }

      if (establishmentId) {
        const establishmentDoc = await db.collection('establishments').doc(establishmentId).get();
        if (!establishmentDoc.exists) {
          return res.status(400).json({ error: 'Estabelecimento não encontrado' });
        }
      }

      const hashedPassword = await hashPassword(password);

      const userId = generateId();
      const newTechnician: User = {
        uid: userId,
        email,
        password: hashedPassword,
        name,
        userType: UserType.TECHNICIAN,
        establishmentId,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      await db.collection('users').doc(userId).set(newTechnician);

      return res.status(201).json({
        message: 'Técnico criado com sucesso',
        user: sanitizeUser(newTechnician),
      });
    } catch (error) {
      console.error('Erro ao criar técnico:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
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

      return res.json({
        user: sanitizeUser(userData),
      });
    } catch (error) {
      console.error('Erro ao buscar usuário atual:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async changePassword(req: AuthRequest, res: Response) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }

      const userDoc = await db.collection('users').doc(req.user.uid).get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const userData = userDoc.data() as User;

      if (userData.password) {
        const isValidPassword = await comparePassword(currentPassword, userData.password);
        if (!isValidPassword) {
          return res.status(400).json({ error: 'Senha atual incorreta' });
        }
      }

      const hashedNewPassword = await hashPassword(newPassword);

      await userDoc.ref.update({
        password: hashedNewPassword,
        updatedAt: new Date(),
      });

      return res.json({ message: 'Senha alterada com sucesso' });
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      const usersRef = db.collection('users');
      const snapshot = await usersRef.where('email', '==', email).get();

      // Sempre retorna sucesso, mesmo se o email não existir
      return res.json({
        message: 'Se o email existir, você receberá instruções para redefinir sua senha',
      });
    } catch (error) {
      console.error('Erro ao solicitar reset de senha:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword } = req.body;

      // Aqui você implementaria a verificação do token de reset
      // Por enquanto, apenas simular o processo

      return res.json({ message: 'Senha redefinida com sucesso' });
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  async logout(req: AuthRequest, res: Response) {
    try {
      // Para JWT, o logout é feito no frontend removendo o token
      // Aqui você pode implementar uma blacklist de tokens se necessário

      return res.json({ message: 'Logout realizado com sucesso' });
    } catch (error) {
      console.error('Erro no logout:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}
