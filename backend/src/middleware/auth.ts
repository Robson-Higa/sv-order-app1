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
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'Token não fornecido' });
    return;
  }

  try {
    const user = await new Promise<any>((resolve, reject) => {
      jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, decoded) => {
        if (err) {
          reject(err);
        } else {
          resolve(decoded);
        }
      });
    });
    (req as any).user = user;
    // Se necessário, busque mais informações do usuário no Firestore ou em outra fonte aqui
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
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

