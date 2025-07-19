import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';
import { User, UserType } from '../types';
import * as admin from 'firebase-admin';

export interface AuthRequest extends Request {
  user?: User;
}

// Middleware de autenticação principal
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Token não fornecido',
        code: 'MISSING_TOKEN'
      });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await auth.verifyIdToken(token);

    if (!decodedToken.uid) {
      return res.status(401).json({ 
        error: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }

    const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
    
    if (!userDoc.exists) {
      console.log(`Usuário ${decodedToken.uid} não encontrado no Firestore`);
      return res.status(403).json({ 
        error: 'Usuário não registrado',
        code: 'USER_NOT_FOUND'
      });
    }

    const userData = userDoc.data();
    
    if (userData?.isActive === false) {
      console.log(`Usuário ${decodedToken.uid} está desativado`);
      return res.status(403).json({
        error: 'Conta desativada',
        code: 'ACCOUNT_DISABLED'
      });
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email ?? userData?.email ?? '',
      userType: userData?.userType || UserType.END_USER,
      name: decodedToken.name ?? userData?.name ?? '',
      isActive: userData?.isActive !== false,
      createdAt: userData?.createdAt?.toDate() ?? new Date(),
      updatedAt: userData?.updatedAt?.toDate() ?? new Date(),
    };

    return next();
    
  } catch (error) {
    console.error('Erro de autenticação:', error);
    return res.status(500).json({
      error: 'Erro na autenticação',
      code: 'AUTH_ERROR'
    });
  }
};

// Factory function para verificação de roles
export const checkRole = (allowedRoles: UserType[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): Response | void => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Não autenticado',
        code: 'UNAUTHENTICATED'
      });
    }
    
    if (!allowedRoles.includes(req.user.userType)) {
      return res.status(403).json({ 
        error: 'Acesso negado',
        code: 'FORBIDDEN',
        requiredRoles: allowedRoles
      });
    }
    
    return next();
  };
};

// Middlewares específicos
export const requireAdmin = checkRole([UserType.ADMIN]);
export const requireTechnician = checkRole([UserType.TECHNICIAN, UserType.ADMIN]);
export const requireEndUser = checkRole([UserType.END_USER, UserType.ADMIN]);