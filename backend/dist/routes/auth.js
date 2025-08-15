"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const AuthController_1 = require("../controllers/AuthController");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const authController = new AuthController_1.AuthController();
router.post('/login', validation_1.validateLogin, authController.login);
router.post('/register', validation_1.validateRegister, authController.register);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/logout', auth_1.authenticateToken, authController.logout);
router.get('/me', auth_1.authenticateToken, authController.getCurrentUser);
router.put('/change-password', auth_1.authenticateToken, authController.changePassword);
router.post('/register-admin', auth_1.authenticateToken, auth_1.requireAdmin, validation_1.validateRegister, authController.registerAdmin);
router.post('/register-technician', auth_1.authenticateToken, auth_1.requireAdmin, validation_1.validateRegister, authController.registerTechnician);
exports.default = router;
//# sourceMappingURL=auth.js.map