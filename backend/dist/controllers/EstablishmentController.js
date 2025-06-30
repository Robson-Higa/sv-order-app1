"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EstablishmentController = void 0;
const firebase_1 = require("../config/firebase");
const types_1 = require("../types");
const helpers_1 = require("../utils/helpers");
class EstablishmentController {
    async getAllEstablishments(req, res) {
        try {
            const establishmentsRef = firebase_1.db.collection('establishments');
            const snapshot = await establishmentsRef
                .where('isActive', '==', true)
                .orderBy('name')
                .get();
            const establishments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            res.json({ establishments });
        }
        catch (error) {
            console.error('Erro ao buscar estabelecimentos:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    async getEstablishmentById(req, res) {
        try {
            const { id } = req.params;
            const establishmentDoc = await firebase_1.db.collection('establishments').doc(id).get();
            if (!establishmentDoc.exists) {
                return res.status(404).json({ error: 'Estabelecimento não encontrado' });
            }
            const establishment = {
                id: establishmentDoc.id,
                ...establishmentDoc.data()
            };
            res.json({ establishment });
        }
        catch (error) {
            console.error('Erro ao buscar estabelecimento:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    async createEstablishment(req, res) {
        try {
            if (req.user?.userType !== types_1.UserType.ADMIN) {
                return res.status(403).json({ error: 'Acesso negado' });
            }
            const { name, address, phone, email } = req.body;
            const existingEstablishment = await firebase_1.db.collection('establishments')
                .where('name', '==', name)
                .where('isActive', '==', true)
                .get();
            if (!existingEstablishment.empty) {
                return res.status(400).json({ error: 'Já existe um estabelecimento com este nome' });
            }
            const establishmentId = (0, helpers_1.generateId)();
            const newEstablishment = {
                id: establishmentId,
                name,
                address,
                phone,
                email,
                createdAt: new Date(),
                updatedAt: new Date(),
                isActive: true
            };
            await firebase_1.db.collection('establishments').doc(establishmentId).set(newEstablishment);
            res.status(201).json({
                message: 'Estabelecimento criado com sucesso',
                establishment: newEstablishment
            });
        }
        catch (error) {
            console.error('Erro ao criar estabelecimento:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    async updateEstablishment(req, res) {
        try {
            if (req.user?.userType !== types_1.UserType.ADMIN) {
                return res.status(403).json({ error: 'Acesso negado' });
            }
            const { id } = req.params;
            const { name, address, phone, email } = req.body;
            const establishmentDoc = await firebase_1.db.collection('establishments').doc(id);
            const establishmentSnapshot = await establishmentDoc.get();
            if (!establishmentSnapshot.exists) {
                return res.status(404).json({ error: 'Estabelecimento não encontrado' });
            }
            if (name) {
                const existingEstablishment = await firebase_1.db.collection('establishments')
                    .where('name', '==', name)
                    .where('isActive', '==', true)
                    .get();
                const conflictingEstablishment = existingEstablishment.docs.find(doc => doc.id !== id);
                if (conflictingEstablishment) {
                    return res.status(400).json({ error: 'Já existe um estabelecimento com este nome' });
                }
            }
            const updateData = {
                updatedAt: new Date()
            };
            if (name)
                updateData.name = name;
            if (address)
                updateData.address = address;
            if (phone !== undefined)
                updateData.phone = phone;
            if (email !== undefined)
                updateData.email = email;
            await establishmentDoc.update(updateData);
            const updatedEstablishmentSnapshot = await establishmentDoc.get();
            const updatedEstablishment = {
                id: updatedEstablishmentSnapshot.id,
                ...updatedEstablishmentSnapshot.data()
            };
            res.json({
                message: 'Estabelecimento atualizado com sucesso',
                establishment: updatedEstablishment
            });
        }
        catch (error) {
            console.error('Erro ao atualizar estabelecimento:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    async deleteEstablishment(req, res) {
        try {
            if (req.user?.userType !== types_1.UserType.ADMIN) {
                return res.status(403).json({ error: 'Acesso negado' });
            }
            const { id } = req.params;
            const establishmentDoc = await firebase_1.db.collection('establishments').doc(id);
            const establishmentSnapshot = await establishmentDoc.get();
            if (!establishmentSnapshot.exists) {
                return res.status(404).json({ error: 'Estabelecimento não encontrado' });
            }
            const usersSnapshot = await firebase_1.db.collection('users')
                .where('establishmentId', '==', id)
                .where('isActive', '==', true)
                .limit(1)
                .get();
            if (!usersSnapshot.empty) {
                return res.status(400).json({
                    error: 'Não é possível excluir estabelecimento com usuários associados. Desative o estabelecimento em vez disso.'
                });
            }
            const serviceOrdersSnapshot = await firebase_1.db.collection('serviceOrders')
                .where('establishmentId', '==', id)
                .limit(1)
                .get();
            if (!serviceOrdersSnapshot.empty) {
                return res.status(400).json({
                    error: 'Não é possível excluir estabelecimento com ordens de serviço associadas. Desative o estabelecimento em vez disso.'
                });
            }
            await establishmentDoc.delete();
            res.json({ message: 'Estabelecimento excluído com sucesso' });
        }
        catch (error) {
            console.error('Erro ao excluir estabelecimento:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    async deactivateEstablishment(req, res) {
        try {
            if (req.user?.userType !== types_1.UserType.ADMIN) {
                return res.status(403).json({ error: 'Acesso negado' });
            }
            const { id } = req.params;
            const establishmentDoc = await firebase_1.db.collection('establishments').doc(id);
            const establishmentSnapshot = await establishmentDoc.get();
            if (!establishmentSnapshot.exists) {
                return res.status(404).json({ error: 'Estabelecimento não encontrado' });
            }
            await establishmentDoc.update({
                isActive: false,
                updatedAt: new Date()
            });
            res.json({ message: 'Estabelecimento desativado com sucesso' });
        }
        catch (error) {
            console.error('Erro ao desativar estabelecimento:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    async activateEstablishment(req, res) {
        try {
            if (req.user?.userType !== types_1.UserType.ADMIN) {
                return res.status(403).json({ error: 'Acesso negado' });
            }
            const { id } = req.params;
            const establishmentDoc = await firebase_1.db.collection('establishments').doc(id);
            const establishmentSnapshot = await establishmentDoc.get();
            if (!establishmentSnapshot.exists) {
                return res.status(404).json({ error: 'Estabelecimento não encontrado' });
            }
            await establishmentDoc.update({
                isActive: true,
                updatedAt: new Date()
            });
            res.json({ message: 'Estabelecimento ativado com sucesso' });
        }
        catch (error) {
            console.error('Erro ao ativar estabelecimento:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    async getEstablishmentStats(req, res) {
        try {
            if (req.user?.userType !== types_1.UserType.ADMIN) {
                return res.status(403).json({ error: 'Acesso negado' });
            }
            const establishmentsRef = firebase_1.db.collection('establishments');
            const [activeSnapshot, totalSnapshot] = await Promise.all([
                establishmentsRef.where('isActive', '==', true).get(),
                establishmentsRef.get()
            ]);
            const stats = {
                totalEstablishments: totalSnapshot.size,
                activeEstablishments: activeSnapshot.size,
                inactiveEstablishments: totalSnapshot.size - activeSnapshot.size
            };
            res.json({ stats });
        }
        catch (error) {
            console.error('Erro ao buscar estatísticas de estabelecimentos:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
}
exports.EstablishmentController = EstablishmentController;
//# sourceMappingURL=EstablishmentController.js.map