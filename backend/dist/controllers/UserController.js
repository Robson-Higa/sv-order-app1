"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const firebase_1 = require("../config/firebase");
const types_1 = require("../types");
const helpers_1 = require("../utils/helpers");
class UserController {
    async getAllUsers(req, res) {
        try {
            if (req.user?.userType !== types_1.UserType.ADMIN) {
                return res.status(403).json({ error: 'Acesso negado' });
            }
            const usersRef = firebase_1.db.collection('users');
            const snapshot = await usersRef.orderBy('createdAt', 'desc').get();
            const users = snapshot.docs.map(doc => {
                const userData = doc.data();
                return (0, helpers_1.sanitizeUser)(userData);
            });
            res.json({ users });
        }
        catch (error) {
            console.error('Erro ao buscar usuários:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    async getUserById(req, res) {
        try {
            const { id } = req.params;
            if (req.user?.userType !== types_1.UserType.ADMIN && req.user?.id !== id) {
                return res.status(403).json({ error: 'Acesso negado' });
            }
            const userDoc = await firebase_1.db.collection('users').doc(id).get();
            if (!userDoc.exists) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }
            const userData = userDoc.data();
            res.json({ user: (0, helpers_1.sanitizeUser)(userData) });
        }
        catch (error) {
            console.error('Erro ao buscar usuário:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    async getUsersByType(req, res) {
        try {
            const { userType } = req.params;
            if (req.user?.userType !== types_1.UserType.ADMIN) {
                return res.status(403).json({ error: 'Acesso negado' });
            }
            if (!Object.values(types_1.UserType).includes(userType)) {
                return res.status(400).json({ error: 'Tipo de usuário inválido' });
            }
            const usersRef = firebase_1.db.collection('users');
            const snapshot = await usersRef
                .where('userType', '==', userType)
                .where('isActive', '==', true)
                .orderBy('name')
                .get();
            const users = snapshot.docs.map(doc => {
                const userData = doc.data();
                return (0, helpers_1.sanitizeUser)(userData);
            });
            res.json({ users });
        }
        catch (error) {
            console.error('Erro ao buscar usuários por tipo:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    async getTechnicians(req, res) {
        try {
            if (req.user?.userType !== types_1.UserType.ADMIN) {
                return res.status(403).json({ error: 'Acesso negado' });
            }
            const usersRef = firebase_1.db.collection('users');
            const snapshot = await usersRef
                .where('userType', '==', types_1.UserType.TECHNICIAN)
                .where('isActive', '==', true)
                .orderBy('name')
                .get();
            const technicians = snapshot.docs.map(doc => {
                const userData = doc.data();
                return (0, helpers_1.sanitizeUser)(userData);
            });
            res.json({ technicians });
        }
        catch (error) {
            console.error('Erro ao buscar técnicos:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    async updateUser(req, res) {
        try {
            const { id } = req.params;
            const { name, email, establishmentId, isActive } = req.body;
            if (req.user?.userType !== types_1.UserType.ADMIN && req.user?.id !== id) {
                return res.status(403).json({ error: 'Acesso negado' });
            }
            const userDoc = await firebase_1.db.collection('users').doc(id);
            const userSnapshot = await userDoc.get();
            if (!userSnapshot.exists) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }
            const updateData = {
                updatedAt: new Date()
            };
            if (name)
                updateData.name = name;
            if (email) {
                const emailCheck = await firebase_1.db.collection('users')
                    .where('email', '==', email)
                    .where('id', '!=', id)
                    .get();
                if (!emailCheck.empty) {
                    return res.status(400).json({ error: 'Email já está em uso' });
                }
                updateData.email = email;
            }
            if (establishmentId !== undefined)
                updateData.establishmentId = establishmentId;
            if (req.user?.userType === types_1.UserType.ADMIN && isActive !== undefined) {
                updateData.isActive = isActive;
            }
            await userDoc.update(updateData);
            const updatedUserSnapshot = await userDoc.get();
            const updatedUserData = updatedUserSnapshot.data();
            res.json({
                message: 'Usuário atualizado com sucesso',
                user: (0, helpers_1.sanitizeUser)(updatedUserData)
            });
        }
        catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    async deactivateUser(req, res) {
        try {
            const { id } = req.params;
            if (req.user?.userType !== types_1.UserType.ADMIN) {
                return res.status(403).json({ error: 'Acesso negado' });
            }
            if (req.user.id === id) {
                return res.status(400).json({ error: 'Você não pode desativar sua própria conta' });
            }
            const userDoc = await firebase_1.db.collection('users').doc(id);
            const userSnapshot = await userDoc.get();
            if (!userSnapshot.exists) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }
            await userDoc.update({
                isActive: false,
                updatedAt: new Date()
            });
            res.json({ message: 'Usuário desativado com sucesso' });
        }
        catch (error) {
            console.error('Erro ao desativar usuário:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    async activateUser(req, res) {
        try {
            const { id } = req.params;
            if (req.user?.userType !== types_1.UserType.ADMIN) {
                return res.status(403).json({ error: 'Acesso negado' });
            }
            const userDoc = await firebase_1.db.collection('users').doc(id);
            const userSnapshot = await userDoc.get();
            if (!userSnapshot.exists) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }
            await userDoc.update({
                isActive: true,
                updatedAt: new Date()
            });
            res.json({ message: 'Usuário ativado com sucesso' });
        }
        catch (error) {
            console.error('Erro ao ativar usuário:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    async deleteUser(req, res) {
        try {
            const { id } = req.params;
            if (req.user?.userType !== types_1.UserType.ADMIN) {
                return res.status(403).json({ error: 'Acesso negado' });
            }
            if (req.user.id === id) {
                return res.status(400).json({ error: 'Você não pode excluir sua própria conta' });
            }
            const userDoc = await firebase_1.db.collection('users').doc(id);
            const userSnapshot = await userDoc.get();
            if (!userSnapshot.exists) {
                return res.status(404).json({ error: 'Usuário não encontrado' });
            }
            const serviceOrdersSnapshot = await firebase_1.db.collection('serviceOrders')
                .where('userId', '==', id)
                .limit(1)
                .get();
            if (!serviceOrdersSnapshot.empty) {
                return res.status(400).json({
                    error: 'Não é possível excluir usuário com ordens de serviço associadas. Desative o usuário em vez disso.'
                });
            }
            await userDoc.delete();
            res.json({ message: 'Usuário excluído com sucesso' });
        }
        catch (error) {
            console.error('Erro ao excluir usuário:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    async getUserStats(req, res) {
        try {
            if (req.user?.userType !== types_1.UserType.ADMIN) {
                return res.status(403).json({ error: 'Acesso negado' });
            }
            const usersRef = firebase_1.db.collection('users');
            const [adminSnapshot, technicianSnapshot, endUserSnapshot] = await Promise.all([
                usersRef.where('userType', '==', types_1.UserType.ADMIN).where('isActive', '==', true).get(),
                usersRef.where('userType', '==', types_1.UserType.TECHNICIAN).where('isActive', '==', true).get(),
                usersRef.where('userType', '==', types_1.UserType.END_USER).where('isActive', '==', true).get()
            ]);
            const stats = {
                totalUsers: adminSnapshot.size + technicianSnapshot.size + endUserSnapshot.size,
                admins: adminSnapshot.size,
                technicians: technicianSnapshot.size,
                endUsers: endUserSnapshot.size,
                activeUsers: adminSnapshot.size + technicianSnapshot.size + endUserSnapshot.size
            };
            res.json({ stats });
        }
        catch (error) {
            console.error('Erro ao buscar estatísticas de usuários:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
}
exports.UserController = UserController;
//# sourceMappingURL=UserController.js.map