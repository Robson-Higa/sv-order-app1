import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

export const apiService = {
  // Authentication
  login: ({ email, password }) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  changePassword: (currentPassword, newPassword) =>
    api.patch('/auth/change-password', { currentPassword, newPassword }),

  // Users
  getUsers: () => api.get('/users'),
  getTechnicians: () => api.get('/users/type/technician'),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.patch(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  activateUser: (id) => api.patch(`/users/${id}/activate`),

  // Establishments
  // Exemplo dos métodos no apiService.ts
  // Correto e limpo
  getEstablishments: () => api.get('/establishments'),
  createEstablishment: (data) => api.post('/establishments', data),
  updateEstablishment: (id, data) => api.put(`/establishments/${id}`, data),
  deleteEstablishment: (id) => api.delete(`/establishments/${id}`),
  deactivateEstablishment: (id) => api.patch(`/establishments/${id}/deactivate`),
  activateEstablishment: (id) => api.patch(`/establishments/${id}/activate`),
  getEstablishments: async () => {
    return await api.get('/establishments'); // Sem .data
  },

  // Service Orders
  getServiceOrders: (filters = {}) => {
    return api.get('/service-orders', { params: filters });
  },
  getServiceOrder: (id) => api.get(`/service-orders/${id}`),
  createServiceOrder: (data) => api.post('/service-orders', data),
  updateServiceOrder: (id, data) => api.patch(`/service-orders/${id}`, data),
  deleteServiceOrder: (id) => api.delete(`/service-orders/${id}`),
  assignTechnician: (id, technicianId) =>
    api.patch(`/service-orders/${id}/assign`, { technicianId }),
  updateStatus: (id, status, notes) => api.patch(`/service-orders/${id}/status`, { status, notes }),
  addFeedback: (id, feedback, rating) =>
    api.patch(`/service-orders/${id}/feedback`, { feedback, rating }),
  confirmCompletion: (id) => api.patch(`/service-orders/${id}/confirm`),

  // Dashboard
  getDashboardStats: () => api.get('/dashboard/stats'),
  getRecentOrders: () => api.get('/dashboard/recent-orders'),
  getActiveOrders: () => api.get('/dashboard/active-orders'),

  // Reports
  getReports: (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    return api.get(`/reports?${params.toString()}`);
  },
};

export default api;
