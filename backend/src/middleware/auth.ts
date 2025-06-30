import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { auth } from '../config/firebase';
import { User, UserType } from '../types';

export interface AuthRequest extends Request {
  user?: User;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({ error: 'Token de acesso requerido' });
      return;
    }

    // Verificar se é um token JWT personalizado ou Firebase token
    if (token.startsWith('eyJ')) {
      // JWT personalizado
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;
      req.user = decoded.user;
    } else {
      // Firebase token
      const decodedToken = await auth.verifyIdToken(token);
      // Buscar dados do usuário no Firestore baseado no UID
      const userDoc = await require('../config/firebase').db.collection('users').doc(decodedToken.uid).get();
      
      if (!userDoc.exists) {
        res.status(401).json({ error: 'Usuário não encontrado' });
        return;
      }
      
      req.user = { id: decodedToken.uid, ...userDoc.data() } as User;
    }

    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    res.status(403).json({ error: 'Token inválido' });
  }
};

export const requireRole = (roles: UserType[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Usuário não autenticado' });
      return;
    }

    if (!roles.includes(req.user.userType)) {
      res.status(403).json({ error: 'Acesso negado. Permissões insuficientes.' });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole([UserType.ADMIN]);
export const requireTechnician = requireRole([UserType.TECHNICIAN, UserType.ADMIN]);
export const requireEndUser = requireRole([UserType.END_USER, UserType.ADMIN]);

