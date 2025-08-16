import { validationResult } from 'express-validator';
import { AuthController } from '../controllers/AuthController';
import { validateLoginWithIdToken, validateRegister } from '../middleware/validation';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const authController = new AuthController();

// Função auxiliar para rodar arrays de ValidationChain do express-validator
async function runValidators(validators: any[], req: any, res: any) {
  for (const validator of validators) {
    await validator.run(req); // req como any para compatibilidade Next.js
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return false;
  }
  return true;
}

// Handler serverless
export default async function handler(req: any, res: any) {
  const { method, url } = req;

  // CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://SEU-FRONTEND.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // ROTAS PÚBLICAS
    if (method === 'POST' && url?.endsWith('/login')) {
      const valid = await runValidators(validateLoginWithIdToken, req, res);
      if (!valid) return;
      return authController.login(req, res);
    }

    if (method === 'POST' && url?.endsWith('/register')) {
      const valid = await runValidators(validateRegister, req, res);
      if (!valid) return;
      return authController.register(req, res);
    }

    if (method === 'POST' && url?.endsWith('/forgot-password')) {
      return authController.forgotPassword(req, res);
    }

    if (method === 'POST' && url?.endsWith('/reset-password')) {
      return authController.resetPassword(req, res);
    }

    // ROTAS PROTEGIDAS
    if (method === 'POST' && url?.endsWith('/logout')) {
      return authenticateToken(req, res, async () => authController.logout(req, res));
    }

    if (method === 'GET' && url?.endsWith('/me')) {
      return authenticateToken(req, res, async () => authController.getCurrentUser(req, res));
    }

    if (method === 'PUT' && url?.endsWith('/change-password')) {
      return authenticateToken(req, res, async () => authController.changePassword(req, res));
    }

    // ROTAS ADMINISTRATIVAS
    if (method === 'POST' && url?.endsWith('/register-admin')) {
      return authenticateToken(req, res, async () =>
        requireAdmin(req, res, async () => {
          const valid = await runValidators(validateRegister, req, res);
          if (!valid) return;
          return authController.registerAdmin(req, res);
        })
      );
    }

    if (method === 'POST' && url?.endsWith('/register-technician')) {
      return authenticateToken(req, res, async () =>
        requireAdmin(req, res, async () => {
          const valid = await runValidators(validateRegister, req, res);
          if (!valid) return;
          return authController.registerTechnician(req, res);
        })
      );
    }

    res.status(404).json({ error: 'Rota não encontrada' });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Erro no servidor' });
  }
}
