import express from 'express';
import { authenticateToken, requireAdmin } from '../../src/middleware/auth';
import { ReportController } from '../../src/controllers/ReportController';
import { updateTechnicianNames } from '../../src/controllers/updateTechnicianName';

const router = express.Router();
const reportController = new ReportController();

router.use(authenticateToken, requireAdmin);

router.get('/status-percentage', reportController.getStatusPercentage.bind(reportController));
router.get('/by-establishment', reportController.getOrdersByEstablishment.bind(reportController));
router.get('/by-technician', reportController.getOrdersByTechnician.bind(reportController));
router.get('/completed-by-date', reportController.getCompletedOrdersByDate.bind(reportController));
// Dentro do arquivo de rotas já existente:

router.get('/orders-report', reportController.getOrdersReport.bind(reportController));

router.post('/fix-technician-names', updateTechnicianNames);

export default router;
