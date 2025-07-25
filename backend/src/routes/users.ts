import express from 'express';
import { UserController } from '../controllers/UserController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();
const userController = new UserController();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

router.post('/', authenticateToken, userController.createUser.bind(userController));

// Rotas administrativas
router.get('/technicians', requireAdmin, userController.getTechnicians);
router.get('/', requireAdmin, userController.getAllUsers);
router.get('/stats', requireAdmin, userController.getUserStats);
router.get('/type/:userType', requireAdmin, userController.getUsersByType);

// Rotas de usuário específico
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.patch('/:id/deactivate', requireAdmin, userController.deactivateUser);
router.patch('/:id/activate', requireAdmin, userController.activateUser);
router.patch('/:id', requireAdmin, userController.updateUser);
router.delete('/:id', requireAdmin, userController.deleteUser);

export default router;

