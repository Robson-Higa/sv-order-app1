import { getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';

import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Adiciona token automaticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Verifique a chave usada
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Retorna só response.data e trata 401
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

export function getServiceOrders(filters = {}) {
  return api.get('/service-orders', { params: filters });
}

export const apiService = {
  // Autenticação
  login: (data) => axios.post(`${API_BASE}/auth/login`, data),
  register: (data) => axios.post(`${API_BASE}/auth/register`, data),
  logout: () => api.post('/auth/logout'),
  changePassword: (currentPassword, newPassword) =>
    api.patch('/auth/change-password', { currentPassword, newPassword }),

  // Usuários
  getUsers: () => api.get('/users'),
  getAllUsers: () => api.get('/users'),
  getTechnicians: () => api.get('/users/technicians'), // ✅ endpoint padronizado
  getEndUsers: () => api.get('/users/type/END_USER'),
  createUser: (data) => api.post('/users', data),
  updateUser: (id, data) => api.patch(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  activateUser: (id) => api.patch(`/users/${id}/activate`),

  // Estabelecimentos
  getEstablishments: () => api.get('/establishments'),
  createEstablishment: (data) => api.post('/establishments', data),
  updateEstablishment: (id, data) => api.put(`/establishments/${id}`, data),
  deleteEstablishment: (id) => api.delete(`/establishments/${id}`),
  deactivateEstablishment: (id) => api.patch(`/establishments/${id}/deactivate`),
  activateEstablishment: (id) => api.patch(`/establishments/${id}/activate`),

  // Ordens de Serviço
  getServiceOrders: (filters = {}) => api.get('/service-orders', { params: filters }),
  getServiceOrder: (id) => api.get(`/service-orders/${id}`),
  createServiceOrder: (data) => api.post('/service-orders', data),
  updateServiceOrder: (id, data) => api.patch(`/service-orders/${id}`, data),
  deleteServiceOrder: (id) => api.delete(`/service-orders/${id}`),

  // Atribuir técnico
  assignTechnician: (id, technicianId) =>
    api.patch(`/service-orders/${id}/assign`, { technicianId }),

  // ✅ Atualizar status (pausar, concluir, etc.)
  updateStatus: (id, status, notes) => api.patch(`/service-orders/${id}/status`, { status, notes }),

  // ✅ Cancelar ordem (com motivo)
  cancelServiceOrder: (id, reason) => api.patch(`/service-orders/${id}/cancel`, { reason }),

  // ✅ Confirmar conclusão
  confirmCompletion: (id) => api.patch(`/service-orders/${id}/confirm`),

  // Feedback
  addFeedback: (id, feedback, rating) =>
    api.patch(`/service-orders/${id}/feedback`, { feedback, rating }),

  // Dashboard
  getDashboardStats: () => api.get('/dashboard/stats'),
  getRecentOrders: () => api.get('/dashboard/recent-orders'),
  getActiveOrders: () => api.get('/dashboard/active-orders'),

  // Relatórios
  getReports: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    return api.get(`/reports?${params.toString()}`);
  },
  getCompletedOrdersByDate: (params) => api.get('/reports/completed-by-date', { params }),
  getStatusPercentage: (params) => api.get('/reports/status-percentage', { params }),
  getOrdersByEstablishment: (params) => api.get('/reports/by-establishment', { params }),
  getOrdersByTechnician: (params) => api.get('/reports/by-technician', { params }),
};
export async function getEndUsers() {
  const response = await api.get('/users/type/END_USER');
  return response.users;
}

export async function fetchTechnicians() {
  const q = query(collection(db, 'users'), where('userType', '==', 'technician'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
}

// Buscar estabelecimentos
export async function fetchEstablishments() {
  const snapshot = await getDocs(collection(db, 'establishments'));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
