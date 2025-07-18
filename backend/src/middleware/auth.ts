import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase'; // Admin SDK Firebase configurado
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
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Token não fornecido' });
      return ;
    }

    const token = authHeader.split(' ')[1];

    // Verifica o token via Firebase Admin SDK
    const decodedToken = await auth.verifyIdToken(token);

    // Extraia as claims customizadas que você configurou no Firebase
    const userType = (decodedToken.userType as UserType) || UserType.END_USER;

    // Monte o objeto user para ser usado no restante da aplicação
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email ?? '',
      userType,
      name: decodedToken.name ?? '',
      isActive: true, // opcional, ou carregue do Firestore se quiser controle dinâmico
      createdAt: new Date(), // ajuste conforme sua necessidade
      updatedAt: new Date(),
    };

    next();
  } catch (error) {
    console.error('Erro de autenticação:', error);
     res.status(401).json({ error: 'Token inválido ou expirado' });
     return
  }
};

export const requireRole = (roles: UserType[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
       res.status(401).json({ error: 'Usuário não autenticado' });
       return
    }
    if (!roles.includes(req.user.userType)) {
       res.status(403).json({ error: 'Acesso negado. Permissões insuficientes.' });
    return
      }
    next();
  };
};

export const requireAdmin = requireRole([UserType.ADMIN]);
export const requireTechnician = requireRole([UserType.TECHNICIAN, UserType.ADMIN]);
export const requireEndUser = requireRole([UserType.END_USER, UserType.ADMIN]);
