// api/auth.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthController } from '../controllers/AuthController';

const authController = new AuthController();

/** Função padrão para Vercel */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, url } = req;

  if (method === 'POST') {
    if (url?.endsWith('/login')) {
      try {
        const expressLikeReq = { body: req.body, headers: req.headers } as any;
        await authController.login(expressLikeReq, res as any);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    } else if (url?.endsWith('/register')) {
      try {
        const expressLikeReq = { body: req.body, headers: req.headers } as any;
        await authController.register(expressLikeReq, res as any);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    } else {
      res.status(404).json({ error: 'Rota não encontrada' });
    }
  } else {
    res.status(405).json({ error: 'Método não permitido' });
  }
}

/** Middleware de autenticação JWT */
export async function authenticate(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'Token ausente' });
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    const user = await authController.verifyTokenString(token);
    return user;
  } catch (err) {
    res.status(401).json({ error: 'Token inválido ou expirado' });
    return null;
  }
}

/** Middleware para checar admin */
export async function requireAdmin(user: any, res: VercelResponse) {
  if (!user?.isAdmin) {
    res.status(403).json({ error: 'Acesso negado: apenas administradores' });
    return false;
  }
  return true;
}
