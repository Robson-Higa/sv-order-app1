import express from 'express';
import { AuthController } from '../controllers/AuthController';
import { validateLogin, validateRegister } from '../middleware/validation';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();
const authController = new AuthController();

// Rotas públicas
router.post('/login', validateLogin, authController.login);
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

