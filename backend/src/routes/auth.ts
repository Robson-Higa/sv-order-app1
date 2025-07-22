import express from 'express';
import { AuthController } from '../controllers/AuthController';
import { validateLoginWithIdToken, validateRegister } from '../middleware/validation';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = express.Router();
const authController = new AuthController();

router.get('/token-info', authenticateToken, (req: AuthRequest, res) => {
  // req.user já deve ter o payload do JWT
  res.json({ tokenPayload: req.user });
});
// Rotas públicas
router.post('/login', validateLoginWithIdToken, authController.login);
router.post('/register', validateRegister, authController.register);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Rotas protegidas
router.post('/logout', authenticateToken, authController.logout);
router.get('/me', authenticateToken, authController.getCurrentUser);
router.put('/change-password', authenticateToken, authController.changePassword);

// Rotas administrativas
router.post('/register-admin', authenticateToken, requireAdmin, validateRegister, authController.registerAdmin);
router.post('/register-technician', authenticateToken, requireAdmin, validateRegister, authController.registerTechnician);

export default router;

