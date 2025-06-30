"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const EstablishmentController_1 = require("../controllers/EstablishmentController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
const establishmentController = new EstablishmentController_1.EstablishmentController();
router.use(auth_1.authenticateToken);
router.get('/', establishmentController.getAllEstablishments);
router.get('/:id', establishmentController.getEstablishmentById);
router.post('/', auth_1.requireAdmin, validation_1.validateEstablishment, establishmentController.createEstablishment);
router.put('/:id', auth_1.requireAdmin, validation_1.validateEstablishment, establishmentController.updateEstablishment);
router.delete('/:id', auth_1.requireAdmin, establishmentController.deleteEstablishment);
router.patch('/:id/deactivate', auth_1.requireAdmin, establishmentController.deactivateEstablishment);
router.patch('/:id/activate', auth_1.requireAdmin, establishmentController.activateEstablishment);
router.get('/admin/stats', auth_1.requireAdmin, establishmentController.getEstablishmentStats);
exports.default = router;
//# sourceMappingURL=establishments.js.map