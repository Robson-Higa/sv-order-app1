import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { ReportController } from '../controllers/ReportController';

const router = express.Router();
const reportController = new ReportController();

router.use(authenticateToken, requireAdmin);

router.get('/status-percentage', reportController.getStatusPercentage.bind(reportController));
router.get('/by-establishment', reportController.getOrdersByEstablishment.bind(reportController));
router.get('/by-technician', reportController.getOrdersByTechnician.bind(reportController));
router.get('/completed-by-date', reportController.getCompletedOrdersByDate.bind(reportController));


export default router;
