"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const UserController_1 = require("../controllers/UserController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const userController = new UserController_1.UserController();
router.use(auth_1.authenticateToken);
router.get('/', auth_1.requireAdmin, userController.getAllUsers);
router.get('/stats', auth_1.requireAdmin, userController.getUserStats);
router.get('/type/:userType', auth_1.requireAdmin, userController.getUsersByType);
router.get('/technicians', auth_1.requireAdmin, userController.getTechnicians);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.patch('/:id/deactivate', auth_1.requireAdmin, userController.deactivateUser);
router.patch('/:id/activate', auth_1.requireAdmin, userController.activateUser);
router.delete('/:id', auth_1.requireAdmin, userController.deleteUser);
exports.default = router;
//# sourceMappingURL=users.js.map