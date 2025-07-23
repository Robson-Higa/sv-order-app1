import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../config/firebase';
import { User, UserType } from '../types';

export interface AuthRequest extends Request {
  user?: User;
}


export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Token não fornecido' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
      uid: string;
      email: string;
      userType: UserType;
    };

    // Preenche req.user com os dados básicos do token
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      userType: decoded.userType,
    } as User;
console.log('[authenticateToken] Usuário autenticado:', req.user);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
};



export const requireRole = (roles: UserType[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
  
console.log('Comparando:', roles, 'com', req.user?.userType);

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
export const requireTechnician = requireRole([UserType.technician, UserType.ADMIN]);
export const requireEndUser = requireRole([UserType.END_USER, UserType.ADMIN]);

