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
router.get('/monthly-stats', serviceOrderController.getMonthlyServiceOrderStats);
router.get('/:id', serviceOrderController.getServiceOrderById);

// Criação de ordem de serviço
router.post('/', validateServiceOrder, serviceOrderController.createServiceOrder);

// Atualização de ordem de serviço
router.put('/:id', serviceOrderController.updateServiceOrder);

// Atualizar status da ordem de serviço (técnico, admin, etc)
router.patch('/:id/status', serviceOrderController.updateStatus);
router.patch('/:id/assign-self', requireTechnician, serviceOrderController.assignSelfToOrder);

// Atribuição de técnico (apenas admin)
router.patch('/:id/assign', requireAdmin, serviceOrderController.assignTechnician);

// Cancelamento de ordem de serviço
router.patch('/:id/cancel', serviceOrderController.cancelServiceOrder);

// Feedback do usuário
router.patch(
  '/:id/feedback',
  authenticateToken,
  validateFeedback,
  serviceOrderController.updateFeedback
);
router.patch('/:id/confirm', serviceOrderController.confirmCompletion);

router.post('/update-lowercase', authenticateToken, requireAdmin, (req, res) =>
  serviceOrderController.updateAllServiceOrdersHandler(req, res)
);

export default router;
