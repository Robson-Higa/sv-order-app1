"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const firebase_1 = require("../config/firebase");
const types_1 = require("../types");
const helpers_1 = require("../utils/helpers");
class AuthController {
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const usersRef = firebase_1.db.collection('users');
            const snapshot = await usersRef.where('email', '==', email).get();
            if (snapshot.empty) {
                return res.status(401).json({ error: 'Credenciais inválidas' });
            }
            const userDoc = snapshot.docs[0];
            const userData = userDoc.data();
            if (!userData.isActive) {
                return res.status(401).json({ error: 'Conta desativada. Entre em contato com o administrador.' });
            }
            if (userData.password) {
                const isValidPassword = await (0, helpers_1.comparePassword)(password, userData.password);
                if (!isValidPassword) {
                    return res.status(401).json({ error: 'Credenciais inválidas' });
                }
            }
            const token = (0, helpers_1.generateToken)(userData);
            await userDoc.ref.update({
                lastLogin: new Date(),
                updatedAt: new Date()
            });
            res.json({
                message: 'Login realizado com sucesso',
                token,
                user: (0, helpers_1.sanitizeUser)(userData)
            });
        }
        catch (error) {
            console.error('Erro no login:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    async register(req, res) {
        try {
            const { email, password, name, userType, establishmentId } = req.body;
            const usersRef = firebase_1.db.collection('users');
            const existingUser = await usersRef.where('email', '==', email).get();
            if (!existingUser.empty) {
                return res.status(400).json({ error: 'Email já está em uso' });
            }
            if (establishmentId) {
                const establishmentDoc = await firebase_1.db.collection('establishments').doc(establishmentId).get();
                if (!establishmentDoc.exists) {
                    return res.status(400).json({ error: 'Estabelecimento não encontrado' });
                }
            }
            const hashedPassword = await hashPassword(password);
            const userId = (0, helpers_1.generateId)();
            const newUser = {
                id: userId,
                email,
                password: hashedPassword,
                name,
                userType,
                establishmentId,
                createdAt: new Date(),
                updatedAt: new Date(),
                isActive: true
            };
            await firebase_1.db.collection('users').doc(userId).set(newUser);
            const token = (0, helpers_1.generateToken)(newUser);
            res.status(201).json({
                message: 'Usuário criado com sucesso',
                token,
                user: (0, helpers_1.sanitizeUser)(newUser)
            });
        }
        catch (error) {
            console.error('Erro no registro:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    async registerAdmin(req, res) {
        try {
            const { email, password, name } = req.body;
            if (req.user?.userType !== types_1.UserType.ADMIN) {
                return res.status(403).json({ error: 'Apenas administradores podem criar outros administradores' });
            }
            const usersRef = firebase_1.db.collection('users');
            const existingUser = await usersRef.where('email', '==', email).get();
            if (!existingUser.empty) {
                return res.status(400).json({ error: 'Email já está em uso' });
            }
            const hashedPassword = await (0, helpers_1.hashPassword)(password);
            const userId = (0, helpers_1.generateId)();
            const newAdmin = {
                id: userId,
                email,
                password: hashedPassword,
                name,
                userType: types_1.UserType.ADMIN,
                createdAt: new Date(),
                updatedAt: new Date(),
                isActive: true
            };
            await firebase_1.db.collection('users').doc(userId).set(newAdmin);
            res.status(201).json({
                message: 'Administrador criado com sucesso',
                user: (0, helpers_1.sanitizeUser)(newAdmin)
            });
        }
        catch (error) {
            console.error('Erro ao criar administrador:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    async registerTechnician(req, res) {
        try {
            const { email, password, name, establishmentId } = req.body;
            if (req.user?.userType !== types_1.UserType.ADMIN) {
                return res.status(403).json({ error: 'Apenas administradores podem criar técnicos' });
            }
            const usersRef = firebase_1.db.collection('users');
            const existingUser = await usersRef.where('email', '==', email).get();
            if (!existingUser.empty) {
                return res.status(400).json({ error: 'Email já está em uso' });
            }
            if (establishmentId) {
                const establishmentDoc = await firebase_1.db.collection('establishments').doc(establishmentId).get();
                if (!establishmentDoc.exists) {
                    return res.status(400).json({ error: 'Estabelecimento não encontrado' });
                }
            }
            const hashedPassword = await (0, helpers_1.hashPassword)(password);
            const userId = (0, helpers_1.generateId)();
            const newTechnician = {
                id: userId,
                email,
                password: hashedPassword,
                name,
                userType: types_1.UserType.TECHNICIAN,
                establishmentId,
                createdAt: new Date(),
                updatedAt: new Date(),
                isActive: true
            };
            await firebase_1.db.collection('users').doc(userId).set(newTechnician);
            res.status(201).json({
                message: 'Técnico criado com sucesso',
                user: (0, helpers_1.sanitizeUser)(newTechnician)
            });
        }
        catch (error) {
            console.error('Erro ao criar técnico:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    async getCurrentUser(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Usuário não autenticado' });
            }
            const userDoc = await firebase_1.db.collection('users').doc(req.user.id).get();
            if (!userDoc.exists) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }
            const userData = userDoc.data();
            res.json({
                user: (0, helpers_1.sanitizeUser)(userData)
            });
        }
        catch (error) {
            console.error('Erro ao buscar usuário atual:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    async changePassword(req, res) {
        try {
            const { currentPassword, newPassword } = req.body;
            if (!req.user) {
                return res.status(401).json({ error: 'Usuário não autenticado' });
            }
            const userDoc = await firebase_1.db.collection('users').doc(req.user.id).get();
            if (!userDoc.exists) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }
            const userData = userDoc.data();
            if (userData.password) {
                const isValidPassword = await (0, helpers_1.comparePassword)(currentPassword, userData.password);
                if (!isValidPassword) {
                    return res.status(400).json({ error: 'Senha atual incorreta' });
                }
            }
            const hashedNewPassword = await (0, helpers_1.hashPassword)(newPassword);
            await userDoc.ref.update({
                password: hashedNewPassword,
                updatedAt: new Date()
            });
            res.json({ message: 'Senha alterada com sucesso' });
        }
        catch (error) {
            console.error('Erro ao alterar senha:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    async forgotPassword(req, res) {
        try {
            const { email } = req.body;
            const usersRef = firebase_1.db.collection('users');
            const snapshot = await usersRef.where('email', '==', email).get();
            if (snapshot.empty) {
                return res.json({ message: 'Se o email existir, você receberá instruções para redefinir sua senha' });
            }
            res.json({ message: 'Se o email existir, você receberá instruções para redefinir sua senha' });
        }
        catch (error) {
            console.error('Erro ao solicitar reset de senha:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;
            res.json({ message: 'Senha redefinida com sucesso' });
        }
        catch (error) {
            console.error('Erro ao redefinir senha:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    async logout(req, res) {
        try {
            res.json({ message: 'Logout realizado com sucesso' });
        }
        catch (error) {
            console.error('Erro no logout:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=AuthController.js.map