"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const firebase_1 = require("../config/firebase");
const types_1 = require("../types");
class DashboardController {
    async getDashboardData(req, res) {
        try {
            const userType = req.user?.userType;
            switch (userType) {
                case types_1.UserType.ADMIN:
                    return this.getAdminDashboard(req, res);
                case types_1.UserType.TECHNICIAN:
                    return this.getTechnicianDashboard(req, res);
                case types_1.UserType.END_USER:
                    return this.getEndUserDashboard(req, res);
                default:
                    return res.status(403).json({ error: 'Tipo de usuário inválido' });
            }
        }
        catch (error) {
            console.error('Erro ao buscar dados do dashboard:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    async getAdminDashboard(req, res) {
        try {
            const serviceOrdersRef = firebase_1.db.collection('serviceOrders');
            const usersRef = firebase_1.db.collection('users');
            const establishmentsRef = firebase_1.db.collection('establishments');
            const [totalOrdersSnapshot, openOrdersSnapshot, inProgressOrdersSnapshot, completedOrdersSnapshot, cancelledOrdersSnapshot] = await Promise.all([
                serviceOrdersRef.get(),
                serviceOrdersRef.where('status', '==', types_1.ServiceOrderStatus.OPEN).get(),
                serviceOrdersRef.where('status', '==', types_1.ServiceOrderStatus.IN_PROGRESS).get(),
                serviceOrdersRef.where('status', '==', types_1.ServiceOrderStatus.COMPLETED).get(),
                serviceOrdersRef.where('status', '==', types_1.ServiceOrderStatus.CANCELLED).get()
            ]);
            const [totalUsersSnapshot, techniciansSnapshot, activeUsersSnapshot] = await Promise.all([
                usersRef.where('isActive', '==', true).get(),
                usersRef.where('userType', '==', types_1.UserType.TECHNICIAN).where('isActive', '==', true).get(),
                usersRef.where('isActive', '==', true).get()
            ]);
            const establishmentsSnapshot = await establishmentsRef.where('isActive', '==', true).get();
            const ordersWithRating = totalOrdersSnapshot.docs.filter(doc => doc.data().userRating);
            const averageRating = ordersWithRating.length > 0
                ? ordersWithRating.reduce((sum, doc) => sum + doc.data().userRating, 0) / ordersWithRating.length
                : 0;
            const currentMonth = new Date();
            currentMonth.setDate(1);
            currentMonth.setHours(0, 0, 0, 0);
            const ordersThisMonthSnapshot = await serviceOrdersRef
                .where('createdAt', '>=', currentMonth)
                .get();
            const lastMonth = new Date(currentMonth);
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            const ordersLastMonthSnapshot = await serviceOrdersRef
                .where('createdAt', '>=', lastMonth)
                .where('createdAt', '<', currentMonth)
                .get();
            const adminStats = {
                totalOrders: totalOrdersSnapshot.size,
                openOrders: openOrdersSnapshot.size,
                inProgressOrders: inProgressOrdersSnapshot.size,
                completedOrders: completedOrdersSnapshot.size,
                cancelledOrders: cancelledOrdersSnapshot.size,
                averageRating: Math.round(averageRating * 100) / 100,
                ordersThisMonth: ordersThisMonthSnapshot.size,
                ordersLastMonth: ordersLastMonthSnapshot.size,
                totalUsers: totalUsersSnapshot.size,
                totalTechnicians: techniciansSnapshot.size,
                totalEstablishments: establishmentsSnapshot.size,
                activeUsers: activeUsersSnapshot.size
            };
            const recentOrdersSnapshot = await serviceOrdersRef
                .orderBy('createdAt', 'desc')
                .limit(10)
                .get();
            const recentOrders = await Promise.all(recentOrdersSnapshot.docs.map(async (doc) => {
                const orderData = doc.data();
                const [userDoc, establishmentDoc] = await Promise.all([
                    firebase_1.db.collection('users').doc(orderData.userId).get(),
                    firebase_1.db.collection('establishments').doc(orderData.establishmentId).get()
                ]);
                return {
                    id: doc.id,
                    ...orderData,
                    user: userDoc.exists ? { id: userDoc.id, name: userDoc.data()?.name } : null,
                    establishment: establishmentDoc.exists ? { id: establishmentDoc.id, name: establishmentDoc.data()?.name } : null
                };
            }));
            res.json({
                stats: adminStats,
                recentOrders,
                userType: types_1.UserType.ADMIN
            });
        }
        catch (error) {
            console.error('Erro no dashboard do administrador:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    async getTechnicianDashboard(req, res) {
        try {
            const technicianId = req.user.id;
            const serviceOrdersRef = firebase_1.db.collection('serviceOrders');
            const [totalOrdersSnapshot, assignedOrdersSnapshot, inProgressOrdersSnapshot, completedOrdersSnapshot, cancelledOrdersSnapshot] = await Promise.all([
                serviceOrdersRef.where('technicianId', '==', technicianId).get(),
                serviceOrdersRef.where('technicianId', '==', technicianId).where('status', '==', types_1.ServiceOrderStatus.ASSIGNED).get(),
                serviceOrdersRef.where('technicianId', '==', technicianId).where('status', '==', types_1.ServiceOrderStatus.IN_PROGRESS).get(),
                serviceOrdersRef.where('technicianId', '==', technicianId).where('status', '==', types_1.ServiceOrderStatus.COMPLETED).get(),
                serviceOrdersRef.where('technicianId', '==', technicianId).where('status', '==', types_1.ServiceOrderStatus.CANCELLED).get()
            ]);
            const completionRate = totalOrdersSnapshot.size > 0
                ? (completedOrdersSnapshot.size / totalOrdersSnapshot.size) * 100
                : 0;
            const ordersWithRating = totalOrdersSnapshot.docs.filter(doc => doc.data().userRating);
            const averageRating = ordersWithRating.length > 0
                ? ordersWithRating.reduce((sum, doc) => sum + doc.data().userRating, 0) / ordersWithRating.length
                : 0;
            const currentMonth = new Date();
            currentMonth.setDate(1);
            currentMonth.setHours(0, 0, 0, 0);
            const ordersThisMonthSnapshot = await serviceOrdersRef
                .where('technicianId', '==', technicianId)
                .where('createdAt', '>=', currentMonth)
                .get();
            const lastMonth = new Date(currentMonth);
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            const ordersLastMonthSnapshot = await serviceOrdersRef
                .where('technicianId', '==', technicianId)
                .where('createdAt', '>=', lastMonth)
                .where('createdAt', '<', currentMonth)
                .get();
            const technicianStats = {
                totalOrders: totalOrdersSnapshot.size,
                openOrders: 0,
                assignedOrders: assignedOrdersSnapshot.size,
                inProgressOrders: inProgressOrdersSnapshot.size,
                completedOrders: completedOrdersSnapshot.size,
                cancelledOrders: cancelledOrdersSnapshot.size,
                averageRating: Math.round(averageRating * 100) / 100,
                ordersThisMonth: ordersThisMonthSnapshot.size,
                ordersLastMonth: ordersLastMonthSnapshot.size,
                completionRate: Math.round(completionRate * 100) / 100
            };
            const activeOrdersSnapshot = await serviceOrdersRef
                .where('technicianId', '==', technicianId)
                .where('status', 'in', [types_1.ServiceOrderStatus.ASSIGNED, types_1.ServiceOrderStatus.IN_PROGRESS])
                .orderBy('createdAt', 'desc')
                .limit(10)
                .get();
            const activeOrders = await Promise.all(activeOrdersSnapshot.docs.map(async (doc) => {
                const orderData = doc.data();
                const [userDoc, establishmentDoc] = await Promise.all([
                    firebase_1.db.collection('users').doc(orderData.userId).get(),
                    firebase_1.db.collection('establishments').doc(orderData.establishmentId).get()
                ]);
                return {
                    id: doc.id,
                    ...orderData,
                    user: userDoc.exists ? { id: userDoc.id, name: userDoc.data()?.name } : null,
                    establishment: establishmentDoc.exists ? { id: establishmentDoc.id, name: establishmentDoc.data()?.name } : null
                };
            }));
            res.json({
                stats: technicianStats,
                activeOrders,
                userType: types_1.UserType.TECHNICIAN
            });
        }
        catch (error) {
            console.error('Erro no dashboard do técnico:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    async getEndUserDashboard(req, res) {
        try {
            const userId = req.user.id;
            const serviceOrdersRef = firebase_1.db.collection('serviceOrders');
            const [totalOrdersSnapshot, openOrdersSnapshot, inProgressOrdersSnapshot, completedOrdersSnapshot, cancelledOrdersSnapshot] = await Promise.all([
                serviceOrdersRef.where('userId', '==', userId).get(),
                serviceOrdersRef.where('userId', '==', userId).where('status', '==', types_1.ServiceOrderStatus.OPEN).get(),
                serviceOrdersRef.where('userId', '==', userId).where('status', 'in', [types_1.ServiceOrderStatus.ASSIGNED, types_1.ServiceOrderStatus.IN_PROGRESS]).get(),
                serviceOrdersRef.where('userId', '==', userId).where('status', 'in', [types_1.ServiceOrderStatus.COMPLETED, types_1.ServiceOrderStatus.CONFIRMED]).get(),
                serviceOrdersRef.where('userId', '==', userId).where('status', '==', types_1.ServiceOrderStatus.CANCELLED).get()
            ]);
            const currentMonth = new Date();
            currentMonth.setDate(1);
            currentMonth.setHours(0, 0, 0, 0);
            const ordersThisMonthSnapshot = await serviceOrdersRef
                .where('userId', '==', userId)
                .where('createdAt', '>=', currentMonth)
                .get();
            const lastMonth = new Date(currentMonth);
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            const ordersLastMonthSnapshot = await serviceOrdersRef
                .where('userId', '==', userId)
                .where('createdAt', '>=', lastMonth)
                .where('createdAt', '<', currentMonth)
                .get();
            const userStats = {
                totalOrders: totalOrdersSnapshot.size,
                openOrders: openOrdersSnapshot.size,
                inProgressOrders: inProgressOrdersSnapshot.size,
                completedOrders: completedOrdersSnapshot.size,
                cancelledOrders: cancelledOrdersSnapshot.size,
                averageRating: 0,
                ordersThisMonth: ordersThisMonthSnapshot.size,
                ordersLastMonth: ordersLastMonthSnapshot.size
            };
            const recentOrdersSnapshot = await serviceOrdersRef
                .where('userId', '==', userId)
                .orderBy('createdAt', 'desc')
                .limit(10)
                .get();
            const recentOrders = await Promise.all(recentOrdersSnapshot.docs.map(async (doc) => {
                const orderData = doc.data();
                const [technicianDoc, establishmentDoc] = await Promise.all([
                    orderData.technicianId ? firebase_1.db.collection('users').doc(orderData.technicianId).get() : null,
                    firebase_1.db.collection('establishments').doc(orderData.establishmentId).get()
                ]);
                return {
                    id: doc.id,
                    ...orderData,
                    technician: technicianDoc?.exists ? { id: technicianDoc.id, name: technicianDoc.data()?.name } : null,
                    establishment: establishmentDoc.exists ? { id: establishmentDoc.id, name: establishmentDoc.data()?.name } : null
                };
            }));
            res.json({
                stats: userStats,
                recentOrders,
                userType: types_1.UserType.END_USER
            });
        }
        catch (error) {
            console.error('Erro no dashboard do usuário:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    async getReports(req, res) {
        try {
            const { startDate, endDate, establishmentId, technicianId, status } = req.query;
            if (req.user?.userType !== types_1.UserType.ADMIN) {
                return res.status(403).json({ error: 'Acesso negado' });
            }
            let query = firebase_1.db.collection('serviceOrders').orderBy('createdAt', 'desc');
            if (startDate) {
                query = query.where('createdAt', '>=', new Date(startDate));
            }
            if (endDate) {
                query = query.where('createdAt', '<=', new Date(endDate));
            }
            if (establishmentId) {
                query = query.where('establishmentId', '==', establishmentId);
            }
            if (technicianId) {
                query = query.where('technicianId', '==', technicianId);
            }
            if (status) {
                query = query.where('status', '==', status);
            }
            const snapshot = await query.get();
            const orders = await Promise.all(snapshot.docs.map(async (doc) => {
                const orderData = doc.data();
                const [userDoc, technicianDoc, establishmentDoc] = await Promise.all([
                    firebase_1.db.collection('users').doc(orderData.userId).get(),
                    orderData.technicianId ? firebase_1.db.collection('users').doc(orderData.technicianId).get() : null,
                    firebase_1.db.collection('establishments').doc(orderData.establishmentId).get()
                ]);
                return {
                    id: doc.id,
                    ...orderData,
                    user: userDoc.exists ? { id: userDoc.id, name: userDoc.data()?.name, email: userDoc.data()?.email } : null,
                    technician: technicianDoc?.exists ? { id: technicianDoc.id, name: technicianDoc.data()?.name, email: technicianDoc.data()?.email } : null,
                    establishment: establishmentDoc.exists ? { id: establishmentDoc.id, name: establishmentDoc.data()?.name, address: establishmentDoc.data()?.address } : null
                };
            }));
            res.json({ orders });
        }
        catch (error) {
            console.error('Erro ao gerar relatório:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
}
exports.DashboardController = DashboardController;
//# sourceMappingURL=DashboardController.js.map