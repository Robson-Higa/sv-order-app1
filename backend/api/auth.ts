// backend/api/auth.ts
import express from 'express';
import { AuthController } from '../src/controllers/AuthController';
import { validateLoginWithIdToken, validateRegister } from '../src/middleware/validation';
import { authenticateToken, requireAdmin, AuthRequest } from '../src/middleware/auth';
const authController = new AuthController();

// Função handler serverless
export default async function handler(req: any, res: any) {
  const { method, url } = req;

  // Configura CORS
  res.setHeader('Access-Control-Allow-Origin', 'https://SEU-FRONTEND.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Rotas públicas
    if (method === 'POST' && url?.endsWith('/login')) {
      await validateLoginWithIdToken(req, res, async () => authController.login(req, res));
      return;
    }

    if (method === 'POST' && url?.endsWith('/register')) {
      await validateRegister(req, res, async () => authController.register(req, res));
      return;
    }

    if (method === 'POST' && url?.endsWith('/forgot-password')) {
      await authController.forgotPassword(req, res);
      return;
    }

    if (method === 'POST' && url?.endsWith('/reset-password')) {
      await authController.resetPassword(req, res);
      return;
    }

    // Rotas protegidas
    if (method === 'POST' && url?.endsWith('/logout')) {
      await authenticateToken(req, res, async () => authController.logout(req, res));
      return;
    }

    if (method === 'GET' && url?.endsWith('/me')) {
      await authenticateToken(req, res, async () => authController.getCurrentUser(req, res));
      return;
    }

    if (method === 'PUT' && url?.endsWith('/change-password')) {
      await authenticateToken(req, res, async () => authController.changePassword(req, res));
      return;
    }

    // Rotas administrativas
    if (method === 'POST' && url?.endsWith('/register-admin')) {
      await authenticateToken(req, res, async () =>
        requireAdmin(req, res, async () =>
          validateRegister(req, res, async () => authController.registerAdmin(req, res))
        )
      );
      return;
    }

    if (method === 'POST' && url?.endsWith('/register-technician')) {
      await authenticateToken(req, res, async () =>
        requireAdmin(req, res, async () =>
          validateRegister(req, res, async () => authController.registerTechnician(req, res))
        )
      );
      return;
    }

    res.status(404).json({ error: 'Rota não encontrada' });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Erro no servidor' });
  }
}
