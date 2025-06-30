import express from 'express';
import { UserController } from '../controllers/UserController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();
const userController = new UserController();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Rotas administrativas
router.get('/', requireAdmin, userController.getAllUsers);
router.get('/stats', requireAdmin, userController.getUserStats);
router.get('/type/:userType', requireAdmin, userController.getUsersByType);
router.get('/technicians', authenticateToken, userController.getTechnicians);

// Rotas de usuário específico
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.patch('/:id/deactivate', requireAdmin, userController.deactivateUser);
router.patch('/:id/activate', requireAdmin, userController.activateUser);
router.delete('/:id', requireAdmin, userController.deleteUser);

export default router;

