import axios from 'axios';
import { getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // pega do .env
  headers: { 'Content-Type': 'application/json' },
});

// Intercepta e adiciona token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Intercepta resposta e trata erro 401
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

export default api;

export const apiService = {
  login: (data) => api.post('/api/auth/login', data),
  register: (data) => api.post('/api/auth/register', data),
  logout: () => api.post('/api/auth/logout'),
  changePassword: (currentPassword, newPassword) =>
    api.patch('/api/auth/change-password', { currentPassword, newPassword }),

  getUsers: () => api.get('/api/users'),
  getTechnicians: () => api.get('/api/users/technicians'),
  getEndUsers: () => api.get('/api/users/type/END_USER'),
  createUser: (data) => api.post('/api/users', data),
  deleteUser: (id) => api.delete(`/api/users/${id}`),
  activateUser: (id) => api.patch(`/api/users/${id}/activate`),
  getUserById: (uid) => api.get(`/api/users/${uid}`),
  updateUser: (uid, data) => api.put(`/api/users/${uid}`, data),
  uploadAvatar: (formData) =>
    api.post('/api/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getEstablishments: () => api.get('/api/establishments'),
  createEstablishment: (data) => api.post('/api/establishments', data),
  updateEstablishment: (id, data) => api.put(`/api/establishments/${id}`, data),
  deleteEstablishment: (id) => api.delete(`/api/establishments/${id}`),
  deactivateEstablishment: (id) => api.patch(`/api/establishments/${id}/deactivate`),
  activateEstablishment: (id) => api.patch(`/api/establishments/${id}/activate`),

  getSectors: (establishmentId) => api.get(`/api/establishments/${establishmentId}/sectors`),
  createSector: (establishmentId, data) =>
    api.post(`/api/establishments/${establishmentId}/sectors`, data),
  updateSector: (establishmentId, sectorId, data) =>
    api.put(`/api/establishments/${establishmentId}/sectors/${sectorId}`, data),
  deleteSector: (establishmentId, sectorId) =>
    api.delete(`/api/establishments/${establishmentId}/sectors/${sectorId}`),

  getServiceOrders: (filters = {}) => api.get('/api/service-orders', { params: filters }),
  getServiceOrder: (id) => api.get(`/api/service-orders/${id}`),
  createServiceOrder: (data) => api.post('/api/service-orders', data),
  updateServiceOrder: (id, data) => api.patch(`/api/service-orders/${id}`, data),
  deleteServiceOrder: (id) => api.delete(`/api/service-orders/${id}`),
  assignTechnician: (id, technicianId) =>
    api.patch(`/api/service-orders/${id}/assign`, { technicianId }),
  updateStatus: (orderId, data) => api.patch(`/api/service-orders/${orderId}/status`, data),
  cancelServiceOrder: (id, reason) => api.patch(`/api/service-orders/${id}/cancel`, { reason }),
  confirmCompletion: (id) => api.patch(`/api/service-orders/${id}/confirm`),
  addFeedback: (id, feedback, rating) =>
    api.patch(`/api/service-orders/${id}/feedback`, { feedback, rating }),

  getDashboardStats: () => api.get('/api/dashboard/stats'),
  getRecentOrders: () => api.get('/api/dashboard/recent-orders'),
  getActiveOrders: () => api.get('/api/dashboard/active-orders'),
  getServiceOrderStats: () => api.get('/api/service-orders/stats'),
  assignSelfToOrder: (id) => api.patch(`/api/service-orders/${id}/assign-self`),
  getMonthlyServiceOrderStats: () => api.get('/api/service-orders/monthly-stats'),
  getReports: (filters = {}) => api.get('/api/reports', { params: filters }),
  getCompletedOrdersByDate: (params) => api.get('/api/reports/completed-by-date', { params }),
  getStatusPercentage: (params) => api.get('/api/reports/status-percentage', { params }),
  getOrdersByEstablishment: (params) => api.get('/api/reports/by-establishment', { params }),
  getOrdersByTechnician: (params) => api.get('/api/reports/by-technician', { params }),
  getOrdersReport: (params) => api.get('/api/reports/orders-report', { params }),
  getCurrentUser: () => api.get('/api/users/me'),
  getTitles: () => api.get('/api/titles'),
};

// Firestore auxiliar
export async function fetchTechnicians() {
  const q = query(collection(db, 'users'), where('userType', '==', 'TECHNICIAN'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
}

export async function fetchEstablishments() {
  const snapshot = await getDocs(collection(db, 'establishments'));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
