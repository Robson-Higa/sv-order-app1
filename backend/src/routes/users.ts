import express from 'express';
import { UserController } from '../controllers/UserController';
import { authenticateToken, requireAdmin, requireTechnician } from '../middleware/auth';

const router = express.Router();
const userController = new UserController();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Rotas administrativas
router.get('/technicians', requireAdmin, userController.getTechnicians.bind(userController));
router.get('/', requireAdmin, userController.getAllUsers.bind(userController));
router.get('/stats', requireAdmin, userController.getUserStats.bind(userController));
router.get('/type/:userType', requireAdmin, userController.getUsersByType.bind(userController));

// Rotas de usuário específico
router.get('/:id', userController.getUserById.bind(userController));
router.put('/:id', userController.updateUser.bind(userController));

// Rotas administrativas para ativação/desativação
router.patch('/:id/deactivate', requireAdmin, userController.deactivateUser.bind(userController));
router.patch('/:id/activate', requireAdmin, userController.activateUser.bind(userController));
router.delete('/:id', requireAdmin, userController.deleteUser.bind(userController));

export default router;