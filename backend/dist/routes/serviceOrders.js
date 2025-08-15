"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const ServiceOrderController_1 = require("../controllers/ServiceOrderController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
const serviceOrderController = new ServiceOrderController_1.ServiceOrderController();
router.use(auth_1.authenticateToken);
router.get('/', serviceOrderController.getAllServiceOrders);
router.get('/stats', serviceOrderController.getServiceOrderStats);
router.get('/:id', serviceOrderController.getServiceOrderById);
router.post('/', validation_1.validateServiceOrder, serviceOrderController.createServiceOrder);
router.put('/:id', serviceOrderController.updateServiceOrder);
router.patch('/:id/assign', auth_1.requireAdmin, serviceOrderController.assignTechnician);
router.patch('/:id/cancel', serviceOrderController.cancelServiceOrder);
router.patch('/:id/feedback', validation_1.validateFeedback, serviceOrderController.updateServiceOrder);
exports.default = router;
//# sourceMappingURL=serviceOrders.js.map