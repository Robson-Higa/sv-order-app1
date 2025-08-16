import express from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = express.Router();
const dashboardController = new DashboardController();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

// Dashboard principal (adaptado ao tipo de usuário)
router.get('/', dashboardController.getDashboardData);

// Novas rotas para o dashboard
router.get('/stats', dashboardController.getStats);
router.get('/recent-orders', dashboardController.getRecentOrders);

// Relatórios (apenas admin)
router.get('/reports', requireAdmin, dashboardController.getReports);

export default router;

