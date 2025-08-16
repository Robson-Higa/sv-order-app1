import express from 'express';
import { EstablishmentController } from '../controllers/EstablishmentController';
import { authenticateToken, requireAdmin } from '../../src/middleware/auth';
import { validateEstablishment } from '../../src/middleware/validation';

const router = express.Router();
const establishmentController = new EstablishmentController();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

router.post('/', establishmentController.createEstablishment.bind(establishmentController));

// Rotas públicas (para usuários autenticados)
router.get('/', establishmentController.getAllEstablishments);
router.get('/:id', establishmentController.getEstablishmentById);

// Rotas administrativas
router.put(
  '/:id',
  requireAdmin,
  validateEstablishment,
  establishmentController.updateEstablishment
);
router.delete('/:id', requireAdmin, establishmentController.deleteEstablishment);
router.patch('/:id/deactivate', requireAdmin, establishmentController.deactivateEstablishment);
router.patch('/:id/activate', requireAdmin, establishmentController.activateEstablishment);
router.get('/admin/stats', requireAdmin, establishmentController.getEstablishmentStats);

export default router;
