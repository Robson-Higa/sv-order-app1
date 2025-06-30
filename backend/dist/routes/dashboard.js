"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const DashboardController_1 = require("../controllers/DashboardController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const dashboardController = new DashboardController_1.DashboardController();
router.use(auth_1.authenticateToken);
router.get('/', dashboardController.getDashboardData);
router.get('/reports', auth_1.requireAdmin, dashboardController.getReports);
exports.default = router;
//# sourceMappingURL=dashboard.js.map