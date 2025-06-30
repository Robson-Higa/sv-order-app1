import express from 'express';
import { ServiceOrderController } from '../controllers/ServiceOrderController';
import { authenticateToken, requireAdmin, requireTechnician } from '../middleware/auth';
import { validateServiceOrder, validateFeedback } from '../middleware/validation';

const router = express.Router();
const serviceOrderController = new ServiceOrderController();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Rotas gerais
router.get('/', serviceOrderController.getAllServiceOrders);
router.get('/stats', serviceOrderController.getServiceOrderStats);
router.get('/:id', serviceOrderController.getServiceOrderById);

// Criação de ordem de serviço
router.post('/', validateServiceOrder, serviceOrderController.createServiceOrder);

// Atualização de ordem de serviço
router.put('/:id', serviceOrderController.updateServiceOrder);

// Atribuição de técnico (apenas admin)
router.patch('/:id/assign', requireAdmin, serviceOrderController.assignTechnician);

// Cancelamento de ordem de serviço
router.patch('/:id/cancel', serviceOrderController.cancelServiceOrder);

// Feedback do usuário
router.patch('/:id/feedback', validateFeedback, serviceOrderController.updateServiceOrder);

export default router;

