"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireEndUser = exports.requireTechnician = exports.requireAdmin = exports.requireRole = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const firebase_1 = require("../config/firebase");
const types_1 = require("../types");
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({ error: 'Token de acesso requerido' });
            return;
        }
        if (token.startsWith('eyJ')) {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'default-secret');
            req.user = decoded.user;
        }
        else {
            const decodedToken = await firebase_1.auth.verifyIdToken(token);
            const userDoc = await require('../config/firebase').db.collection('users').doc(decodedToken.uid).get();
            if (!userDoc.exists) {
                res.status(401).json({ error: 'Usuário não encontrado' });
                return;
            }
            req.user = { id: decodedToken.uid, ...userDoc.data() };
        }
        next();
    }
    catch (error) {
        console.error('Erro na autenticação:', error);
        res.status(403).json({ error: 'Token inválido' });
    }
};
exports.authenticateToken = authenticateToken;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ error: 'Usuário não autenticado' });
            return;
        }
        if (!roles.includes(req.user.userType)) {
            res.status(403).json({ error: 'Acesso negado. Permissões insuficientes.' });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
exports.requireAdmin = (0, exports.requireRole)([types_1.UserType.ADMIN]);
exports.requireTechnician = (0, exports.requireRole)([types_1.UserType.TECHNICIAN, types_1.UserType.ADMIN]);
exports.requireEndUser = (0, exports.requireRole)([types_1.UserType.END_USER, types_1.UserType.ADMIN]);
//# sourceMappingURL=auth.js.map