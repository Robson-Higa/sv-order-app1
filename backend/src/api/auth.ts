import { VercelRequest, VercelResponse } from '@vercel/node';
import { AuthController } from '../controllers/AuthController';

const authController = new AuthController();

/** Validações customizadas para serverless */
function validateLoginBody(req: VercelRequest) {
  const { idToken } = req.body || {};
  if (!idToken || typeof idToken !== 'string') {
    return { valid: false, errors: [{ msg: 'idToken ausente ou inválido' }] };
  }
  return { valid: true, errors: [] };
}

function validateRegisterBody(req: VercelRequest) {
  const { email, password, name } = req.body || {};
  const errors: { msg: string }[] = [];

  if (!email || typeof email !== 'string') errors.push({ msg: 'Email ausente ou inválido' });
  if (!password || typeof password !== 'string' || password.length < 6)
    errors.push({ msg: 'Senha inválida (mínimo 6 caracteres)' });
  if (!name || typeof name !== 'string') errors.push({ msg: 'Nome ausente ou inválido' });

  return { valid: errors.length === 0, errors };
}

async function authenticate(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'Token ausente' });
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    const user = await authController.verifyTokenString(token); // ✅ usar verifyTokenString
    return user;
  } catch (err) {
    res.status(401).json({ error: 'Token inválido ou expirado' });
    return null;
  }
}

/** Middleware para checar admin */
async function requireAdmin(user: any, res: VercelResponse) {
  if (!user?.isAdmin) {
    res.status(403).json({ error: 'Acesso negado: apenas administradores' });
    return false;
  }
  return true;
}

export default class AuthHandler {
  async handler(req: VercelRequest, res: VercelResponse) {
    const { method, url } = req;

    if (method === 'POST' && url?.endsWith('/login')) {
      try {
        // Adaptar VercelRequest para algo compatível com Express
        const expressLikeReq = {
          body: req.body,
          headers: req.headers,
        } as any;

        await authController.login(expressLikeReq, res as any);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro interno do servidor' });
      }
    } else {
      res.status(405).json({ error: 'Método não permitido' });
    }
  }
}
