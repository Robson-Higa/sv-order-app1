import axios from 'axios';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';

const API_BASE = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    Expires: '0',
  },
});

// ✅ Intercepta e adiciona token automaticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Retorna só response.data e trata erro 401
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    console.error('API error:', error);
    return Promise.reject(error.response?.data || error.message);
  }
);

export const apiService = {
  /** ===================== AUTENTICAÇÃO ===================== **/
  login: (data) => axios.post(`${API_BASE}/auth/login`, data),
  register: (data) => axios.post(`${API_BASE}/auth/register`, data),
  logout: () => api.post('/auth/logout'),
  changePassword: (currentPassword, newPassword) =>
    api.patch('/auth/change-password', { currentPassword, newPassword }),

  /** ===================== USUÁRIOS ===================== **/
  getUsers: () => api.get('/users'),
  getTechnicians: () => api.get('/users/technicians'),
  getEndUsers: () => api.get('/users/type/END_USER'),
  createUser: (data) => api.post('/users', data),
  //updateUser: (id, data) => api.patch(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  activateUser: (id) => api.patch(`/users/${id}/activate`),

  getUserById: async (uid) => {
    const res = await axios.get(`${API_BASE}/users/${uid}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    return res.data;
  },

  updateUser: async (uid, data) => {
    const res = await axios.put(`${API_BASE}/users/${uid}`, data, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    return res.data;
  },

  uploadAvatar: async (formData) => {
    const res = await axios.post(`${API_BASE}/users/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
    return res.data;
  },

  /** ===================== ESTABELECIMENTOS ===================== **/
  getEstablishments: () => api.get('/establishments'),
  createEstablishment: (data) => api.post('/establishments', data),
  updateEstablishment: (id, data) => api.put(`/establishments/${id}`, data),
  deleteEstablishment: (id) => api.delete(`/establishments/${id}`),
  deactivateEstablishment: (id) => api.patch(`/establishments/${id}/deactivate`),
  activateEstablishment: (id) => api.patch(`/establishments/${id}/activate`),

  // Setores
  getSectors: (establishmentId) => api.get(`/establishments/${establishmentId}/sectors`),

  createSector: (establishmentId, data) =>
    api.post(`/establishments/${establishmentId}/sectors`, data),

  updateSector: (establishmentId, sectorId, data) =>
    api.put(`/establishments/${establishmentId}/sectors/${sectorId}`, data),

  deleteSector: (establishmentId, sectorId) =>
    api.delete(`/establishments/${establishmentId}/sectors/${sectorId}`),

  /** ===================== ORDENS DE SERVIÇO ===================== **/
  getServiceOrders: (filters = {}) => api.get('/service-orders', { params: filters }),
  getServiceOrder: (id) => api.get(`/service-orders/${id}`),
  createServiceOrder: (data) => api.post('/service-orders', data),
  updateServiceOrder: (id, data) => api.patch(`/service-orders/${id}`, data),
  deleteServiceOrder: (id) => api.delete(`/service-orders/${id}`),
  assignTechnician: (id, technicianId) =>
    api.patch(`/service-orders/${id}/assign`, { technicianId }),
  updateStatus: (orderId, data) => api.patch(`/service-orders/${orderId}/status`, data),

  cancelServiceOrder: (id, reason) => api.patch(`/service-orders/${id}/cancel`, { reason }),
  confirmCompletion: (id) => api.patch(`/service-orders/${id}/confirm`),
  addFeedback: (id, feedback, rating) =>
    api.patch(`/service-orders/${id}/feedback`, { feedback, rating }),

  /** ===================== DASHBOARD / RELATÓRIOS ===================== **/
  getDashboardStats: () => api.get('/dashboard/stats'),
  getRecentOrders: () => api.get('/dashboard/recent-orders'),
  getActiveOrders: () => api.get('/dashboard/active-orders'),

  getServiceOrderStats: () => api.get('/service-orders/stats'),
  assignSelfToOrder: (id) => api.patch(`/service-orders/${id}/assign-self`),

  // Estatísticas mensais (quantidade de ordens por mês)
  getMonthlyServiceOrderStats: () => api.get('/service-orders/monthly-stats'),

  // Relatórios
  getReports: (filters = {}) => api.get('/reports', { params: filters }),
  getCompletedOrdersByDate: (params) => api.get('/reports/completed-by-date', { params }),
  getStatusPercentage: (params) => api.get('/reports/status-percentage', { params }),
  getOrdersByEstablishment: (params) => api.get('/reports/by-establishment', { params }),
  getOrdersByTechnician: (params) => api.get('/reports/by-technician', { params }),

  getOrdersReport: (params) => api.get('/reports/orders-report', { params }),
  /** ===================== USUÁRIO ATUAL ===================== **/
  getCurrentUser: () => api.get('/users/me'),

  getTitles: () => api.get('/titles'),
};

/** ===================== FIRESTORE AUXILIAR ===================== **/
export async function fetchTechnicians() {
  const q = query(collection(db, 'users'), where('userType', '==', 'TECHNICIAN'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
}

export async function fetchEstablishments() {
  const snapshot = await getDocs(collection(db, 'establishments'));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function updateServiceOrderStatus(orderId, status, extraData = {}) {
  try {
    const response = await api.patch(`/service-orders/${orderId}/status`, {
      status,
      ...extraData,
    });
    return response.data;
  } catch (error) {
    console.error('API error:', error);
    throw error.response?.data || { error: 'Erro ao atualizar status da ordem' };
  }
}

// Exemplo de função no apiService.js
export async function getServiceOrderById(id) {
  const response = await api.get(`/service-orders/${id}`);
  return response.data;
}
