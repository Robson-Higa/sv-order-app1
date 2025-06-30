"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceOrderController = void 0;
const firebase_1 = require("../config/firebase");
const types_1 = require("../types");
const helpers_1 = require("../utils/helpers");
class ServiceOrderController {
    async getAllServiceOrders(req, res) {
        try {
            const { status, establishmentId, technicianId, userId, page = 1, limit = 20 } = req.query;
            let query = firebase_1.db.collection('serviceOrders').orderBy('createdAt', 'desc');
            if (req.user?.userType === types_1.UserType.TECHNICIAN) {
                query = query.where('technicianId', '==', req.user.id);
            }
            else if (req.user?.userType === types_1.UserType.END_USER) {
                query = query.where('userId', '==', req.user.id);
            }
            if (status) {
                query = query.where('status', '==', status);
            }
            if (establishmentId) {
                query = query.where('establishmentId', '==', establishmentId);
            }
            if (technicianId && req.user?.userType === types_1.UserType.ADMIN) {
                query = query.where('technicianId', '==', technicianId);
            }
            if (userId && req.user?.userType === types_1.UserType.ADMIN) {
                query = query.where('userId', '==', userId);
            }
            const pageNumber = parseInt(page);
            const limitNumber = parseInt(limit);
            const offset = (pageNumber - 1) * limitNumber;
            const snapshot = await query.limit(limitNumber).offset(offset).get();
            const serviceOrders = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            const enrichedOrders = await Promise.all(serviceOrders.map(async (order) => {
                const [userDoc, technicianDoc, establishmentDoc] = await Promise.all([
                    firebase_1.db.collection('users').doc(order.userId).get(),
                    order.technicianId ? firebase_1.db.collection('users').doc(order.technicianId).get() : null,
                    firebase_1.db.collection('establishments').doc(order.establishmentId).get()
                ]);
                return {
                    ...order,
                    user: userDoc.exists ? { id: userDoc.id, name: userDoc.data()?.name } : null,
                    technician: technicianDoc?.exists ? { id: technicianDoc.id, name: technicianDoc.data()?.name } : null,
                    establishment: establishmentDoc.exists ? { id: establishmentDoc.id, name: establishmentDoc.data()?.name } : null
                };
            }));
            res.json({ serviceOrders: enrichedOrders });
        }
        catch (error) {
            console.error('Erro ao buscar ordens de serviço:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    async getServiceOrderById(req, res) {
        try {
            const { id } = req.params;
            const serviceOrderDoc = await firebase_1.db.collection('serviceOrders').doc(id).get();
            if (!serviceOrderDoc.exists) {
                return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
            }
            const serviceOrder = {
                id: serviceOrderDoc.id,
                ...serviceOrderDoc.data()
            };
            if (req.user?.userType === types_1.UserType.END_USER && serviceOrder.userId !== req.user.id) {
                return res.status(403).json({ error: 'Acesso negado' });
            }
            if (req.user?.userType === types_1.UserType.TECHNICIAN && serviceOrder.technicianId !== req.user.id) {
                return res.status(403).json({ error: 'Acesso negado' });
            }
            const [userDoc, technicianDoc, establishmentDoc] = await Promise.all([
                firebase_1.db.collection('users').doc(serviceOrder.userId).get(),
                serviceOrder.technicianId ? firebase_1.db.collection('users').doc(serviceOrder.technicianId).get() : null,
                firebase_1.db.collection('establishments').doc(serviceOrder.establishmentId).get()
            ]);
            const enrichedOrder = {
                ...serviceOrder,
                user: userDoc.exists ? { id: userDoc.id, name: userDoc.data()?.name, email: userDoc.data()?.email } : null,
                technician: technicianDoc?.exists ? { id: technicianDoc.id, name: technicianDoc.data()?.name, email: technicianDoc.data()?.email } : null,
                establishment: establishmentDoc.exists ? { id: establishmentDoc.id, name: establishmentDoc.data()?.name, address: establishmentDoc.data()?.address } : null
            };
            res.json({ serviceOrder: enrichedOrder });
        }
        catch (error) {
            console.error('Erro ao buscar ordem de serviço:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    async createServiceOrder(req, res) {
        try {
            const { title, description, establishmentId, priority, scheduledDate } = req.body;
            if (req.user?.userType !== types_1.UserType.END_USER && req.user?.userType !== types_1.UserType.ADMIN) {
                return res.status(403).json({ error: 'Apenas usuários finais podem criar ordens de serviço' });
            }
            const establishmentDoc = await firebase_1.db.collection('establishments').doc(establishmentId).get();
            if (!establishmentDoc.exists) {
                return res.status(400).json({ error: 'Estabelecimento não encontrado' });
            }
            const serviceOrderId = (0, helpers_1.generateId)();
            const orderNumber = (0, helpers_1.generateOrderNumber)();
            const newServiceOrder = {
                id: serviceOrderId,
                orderNumber,
                userId: req.user.id,
                establishmentId,
                title,
                description,
                status: types_1.ServiceOrderStatus.OPEN,
                priority: priority || types_1.Priority.MEDIUM,
                createdAt: new Date(),
                updatedAt: new Date(),
                scheduledDate: scheduledDate ? new Date(scheduledDate) : undefined,
                userConfirmed: false
            };
            await firebase_1.db.collection('serviceOrders').doc(serviceOrderId).set(newServiceOrder);
            res.status(201).json({
                message: 'Ordem de serviço criada com sucesso',
                serviceOrder: newServiceOrder
            });
        }
        catch (error) {
            console.error('Erro ao criar ordem de serviço:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    async updateServiceOrder(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const serviceOrderDoc = await firebase_1.db.collection('serviceOrders').doc(id);
            const serviceOrderSnapshot = await serviceOrderDoc.get();
            if (!serviceOrderSnapshot.exists) {
                return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
            }
            const serviceOrder = serviceOrderSnapshot.data();
            if (req.user?.userType === types_1.UserType.END_USER && serviceOrder.userId !== req.user.id) {
                return res.status(403).json({ error: 'Acesso negado' });
            }
            if (req.user?.userType === types_1.UserType.TECHNICIAN && serviceOrder.technicianId !== req.user.id) {
                return res.status(403).json({ error: 'Acesso negado' });
            }
            const updates = {
                updatedAt: new Date()
            };
            if (req.user?.userType === types_1.UserType.ADMIN) {
                if (updateData.title)
                    updates.title = updateData.title;
                if (updateData.description)
                    updates.description = updateData.description;
                if (updateData.status)
                    updates.status = updateData.status;
                if (updateData.priority)
                    updates.priority = updateData.priority;
                if (updateData.scheduledDate)
                    updates.scheduledDate = new Date(updateData.scheduledDate);
                if (updateData.technicianNotes)
                    updates.technicianNotes = updateData.technicianNotes;
            }
            else if (req.user?.userType === types_1.UserType.TECHNICIAN) {
                if (updateData.status && [types_1.ServiceOrderStatus.IN_PROGRESS, types_1.ServiceOrderStatus.COMPLETED].includes(updateData.status)) {
                    updates.status = updateData.status;
                    if (updateData.status === types_1.ServiceOrderStatus.COMPLETED) {
                        updates.completedDate = new Date();
                    }
                }
                if (updateData.technicianNotes)
                    updates.technicianNotes = updateData.technicianNotes;
            }
            else if (req.user?.userType === types_1.UserType.END_USER) {
                if (updateData.userFeedback)
                    updates.userFeedback = updateData.userFeedback;
                if (updateData.userRating)
                    updates.userRating = updateData.userRating;
                if (serviceOrder.status === types_1.ServiceOrderStatus.COMPLETED && updateData.userFeedback && updateData.userRating) {
                    updates.userConfirmed = true;
                    updates.status = types_1.ServiceOrderStatus.CONFIRMED;
                }
            }
            await serviceOrderDoc.update(updates);
            const updatedServiceOrderSnapshot = await serviceOrderDoc.get();
            const updatedServiceOrder = {
                id: updatedServiceOrderSnapshot.id,
                ...updatedServiceOrderSnapshot.data()
            };
            res.json({
                message: 'Ordem de serviço atualizada com sucesso',
                serviceOrder: updatedServiceOrder
            });
        }
        catch (error) {
            console.error('Erro ao atualizar ordem de serviço:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    async assignTechnician(req, res) {
        try {
            const { id } = req.params;
            const { technicianId } = req.body;
            if (req.user?.userType !== types_1.UserType.ADMIN) {
                return res.status(403).json({ error: 'Apenas administradores podem atribuir técnicos' });
            }
            const technicianDoc = await firebase_1.db.collection('users').doc(technicianId).get();
            if (!technicianDoc.exists || technicianDoc.data()?.userType !== types_1.UserType.TECHNICIAN) {
                return res.status(400).json({ error: 'Técnico não encontrado' });
            }
            const serviceOrderDoc = await firebase_1.db.collection('serviceOrders').doc(id);
            const serviceOrderSnapshot = await serviceOrderDoc.get();
            if (!serviceOrderSnapshot.exists) {
                return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
            }
            await serviceOrderDoc.update({
                technicianId,
                status: types_1.ServiceOrderStatus.ASSIGNED,
                updatedAt: new Date()
            });
            res.json({ message: 'Técnico atribuído com sucesso' });
        }
        catch (error) {
            console.error('Erro ao atribuir técnico:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    async cancelServiceOrder(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const serviceOrderDoc = await firebase_1.db.collection('serviceOrders').doc(id);
            const serviceOrderSnapshot = await serviceOrderDoc.get();
            if (!serviceOrderSnapshot.exists) {
                return res.status(404).json({ error: 'Ordem de serviço não encontrada' });
            }
            const serviceOrder = serviceOrderSnapshot.data();
            if (req.user?.userType === types_1.UserType.END_USER && serviceOrder.userId !== req.user.id) {
                return res.status(403).json({ error: 'Acesso negado' });
            }
            if ([types_1.ServiceOrderStatus.COMPLETED, types_1.ServiceOrderStatus.CONFIRMED, types_1.ServiceOrderStatus.CANCELLED].includes(serviceOrder.status)) {
                return res.status(400).json({ error: 'Esta ordem de serviço não pode ser cancelada' });
            }
            await serviceOrderDoc.update({
                status: types_1.ServiceOrderStatus.CANCELLED,
                cancellationReason: reason,
                updatedAt: new Date()
            });
            res.json({ message: 'Ordem de serviço cancelada com sucesso' });
        }
        catch (error) {
            console.error('Erro ao cancelar ordem de serviço:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    async getServiceOrderStats(req, res) {
        try {
            const serviceOrdersRef = firebase_1.db.collection('serviceOrders');
            let baseQuery = serviceOrdersRef;
            if (req.user?.userType === types_1.UserType.TECHNICIAN) {
                baseQuery = serviceOrdersRef.where('technicianId', '==', req.user.id);
            }
            else if (req.user?.userType === types_1.UserType.END_USER) {
                baseQuery = serviceOrdersRef.where('userId', '==', req.user.id);
            }
            const [totalSnapshot, openSnapshot, assignedSnapshot, inProgressSnapshot, completedSnapshot, confirmedSnapshot, cancelledSnapshot] = await Promise.all([
                baseQuery.get(),
                baseQuery.where('status', '==', types_1.ServiceOrderStatus.OPEN).get(),
                baseQuery.where('status', '==', types_1.ServiceOrderStatus.ASSIGNED).get(),
                baseQuery.where('status', '==', types_1.ServiceOrderStatus.IN_PROGRESS).get(),
                baseQuery.where('status', '==', types_1.ServiceOrderStatus.COMPLETED).get(),
                baseQuery.where('status', '==', types_1.ServiceOrderStatus.CONFIRMED).get(),
                baseQuery.where('status', '==', types_1.ServiceOrderStatus.CANCELLED).get()
            ]);
            const stats = {
                total: totalSnapshot.size,
                open: openSnapshot.size,
                assigned: assignedSnapshot.size,
                inProgress: inProgressSnapshot.size,
                completed: completedSnapshot.size,
                confirmed: confirmedSnapshot.size,
                cancelled: cancelledSnapshot.size
            };
            res.json({ stats });
        }
        catch (error) {
            console.error('Erro ao buscar estatísticas de ordens de serviço:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
}
exports.ServiceOrderController = ServiceOrderController;
//# sourceMappingURL=ServiceOrderController.js.map