// routes/publicRoutes.ts
import { Router } from 'express';
import {
  getPublicEstablishments,
  publicRegister,
  googleLoginRedirect,
  googleLoginCallback,
} from '../controllers/publicAuthController';

const router = Router();

// Rota para cadastro público
router.post('/public-register', publicRegister);

// Rota para listar estabelecimentos
router.get('/public/establishments', getPublicEstablishments);

// Google OAuth
router.get('/public/google-login', googleLoginRedirect);
router.get('/public/google-login/callback', googleLoginCallback);

export default router;
