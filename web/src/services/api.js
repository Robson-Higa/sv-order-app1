import axios from 'axios';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';

// 1. Configuração base da API
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api', // Funciona em dev e produção
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
  },
});

// 2. Interceptor de Autenticação (centralizado)
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

// 3. Tratamento Centralizado de Erros
api.interceptors.response.use(
  (response) => response.data, // Retorna apenas os dados
  (error) => {
    const errorData = error.response?.data || { message: 'Erro desconhecido' };

    // Tratamento específico para 401 (não autorizado)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    console.error('API Error:', errorData);
    return Promise.reject(errorData);
  }
);

// 4. API Service Unificado
export const apiService = {
  // ========== Autenticação ==========
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  changePassword: (data) => api.patch('/auth/change-password', data),

  // ========== Usuários ==========
  users: {
    list: () => api.get('/users'),
    get: (uid) => api.get(`/users/${uid}`),
    create: (data) => api.post('/users', data),
    update: (uid, data) => api.put(`/users/${uid}`, data),
    delete: (id) => api.delete(`/users/${id}`),
    activate: (id) => api.patch(`/users/${id}/activate`),
    uploadAvatar: (formData) => {
      return api.post('/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    },
    getTechnicians: () => api.get('/users/technicians'),
    getEndUsers: () => api.get('/users/type/END_USER'),
    getCurrent: () => api.get('/users/me'),
  },

  // ========== Estabelecimentos ==========
  establishments: {
    list: () => api.get('/establishments'),
    create: (data) => api.post('/establishments', data),
    update: (id, data) => api.put(`/establishments/${id}`, data),
    delete: (id) => api.delete(`/establishments/${id}`),
    activate: (id) => api.patch(`/establishments/${id}/activate`),
    deactivate: (id) => api.patch(`/establishments/${id}/deactivate`),

    sectors: {
      list: (establishmentId) => api.get(`/establishments/${establishmentId}/sectors`),
      create: (establishmentId, data) =>
        api.post(`/establishments/${establishmentId}/sectors`, data),
      update: (establishmentId, sectorId, data) =>
        api.put(`/establishments/${establishmentId}/sectors/${sectorId}`, data),
      delete: (establishmentId, sectorId) =>
        api.delete(`/establishments/${establishmentId}/sectors/${sectorId}`),
    },
  },

  // ========== Ordens de Serviço ==========
  serviceOrders: {
    list: (filters = {}) => api.get('/service-orders', { params: filters }),
    get: (id) => api.get(`/service-orders/${id}`),
    create: (data) => api.post('/service-orders', data),
    update: (id, data) => api.patch(`/service-orders/${id}`, data),
    delete: (id) => api.delete(`/service-orders/${id}`),
    assignTechnician: (id, technicianId) =>
      api.patch(`/service-orders/${id}/assign`, { technicianId }),
    updateStatus: (id, status, extraData = {}) =>
      api.patch(`/service-orders/${id}/status`, { status, ...extraData }),
    cancel: (id, reason) => api.patch(`/service-orders/${id}/cancel`, { reason }),
    confirmCompletion: (id) => api.patch(`/service-orders/${id}/confirm`),
    addFeedback: (id, data) => api.patch(`/service-orders/${id}/feedback`, data),
    assignSelf: (id) => api.patch(`/service-orders/${id}/assign-self`),
  },

  // ========== Dashboard & Relatórios ==========
  dashboard: {
    stats: () => api.get('/dashboard/stats'),
    recentOrders: () => api.get('/dashboard/recent-orders'),
    activeOrders: () => api.get('/dashboard/active-orders'),
  },

  reports: {
    list: (filters = {}) => api.get('/reports', { params: filters }),
    completedByDate: (params) => api.get('/reports/completed-by-date', { params }),
    statusPercentage: (params) => api.get('/reports/status-percentage', { params }),
    byEstablishment: (params) => api.get('/reports/by-establishment', { params }),
    byTechnician: (params) => api.get('/reports/by-technician', { params }),
    ordersReport: (params) => api.get('/reports/orders-report', { params }),
  },
};

// ========== Funções do Firestore (se realmente necessário) ==========
export const firestoreService = {
  fetchTechnicians: async () => {
    const q = query(collection(db, 'users'), where('userType', '==', 'TECHNICIAN'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
  },

  fetchEstablishments: async () => {
    const snapshot = await getDocs(collection(db, 'establishments'));
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  },
};
