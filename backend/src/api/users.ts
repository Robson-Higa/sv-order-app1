import express from 'express';
import { UserController } from '../../src/controllers/UserController';
import { authenticateToken, requireAdmin } from '../../src/middleware/auth';
import multer from 'multer';

const router = express.Router();
const userController = new UserController();
const upload = multer({ storage: multer.memoryStorage() });

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Rota de perfil do usuário logado
router.get('/me', userController.getProfile.bind(userController));

// Rotas administrativas
router.get('/technicians', requireAdmin, userController.getTechnicians);
router.get('/', requireAdmin, userController.getAllUsers);
router.post('/', requireAdmin, userController.createUser.bind(userController));
router.get('/stats', requireAdmin, userController.getUserStats);
router.get('/type/:userType', requireAdmin, userController.getUsersByType);

// Rotas de usuário específico (por id)
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.patch('/:id/deactivate', requireAdmin, userController.deactivateUser);
router.patch('/:id/activate', requireAdmin, userController.activateUser);
router.patch('/:id', requireAdmin, userController.updateUser);
router.delete('/:id', requireAdmin, userController.deleteUser);

// Avatar upload
router.post('/avatar', upload.single('file'), userController.uploadAvatar.bind(userController));

export default router;
