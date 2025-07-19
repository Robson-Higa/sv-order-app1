import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Enhanced request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;

      // Add user type if available
      const user = JSON.parse(localStorage.getItem('user') || {});
      if (user.userType) {
        config.headers['X-User-Type'] = user.userType;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Enhanced response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;

    if (status === 401 || status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(
      error.response?.data || { error: error.message || 'Unknown error occurred' }
    );
  }
);

// Consolidated API methods
export const apiService = {
  // Auth
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  verifyToken: () => api.get('/auth/verify'),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),

  // Users
  getUsers: () => api.get('/users'),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, data) => api.patch(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  activateUser: (id) => api.patch(`/users/${id}/activate`),

  // User Types
  getTechnicians: () => api.get('/users/type/technician'),
  getEndUsers: () => api.get('/users/type/end_user'),

  // Establishments (single implementation)
  getEstablishments: () => api.get('/establishments'),
  createEstablishment: (data) => api.post('/establishments', data),
  updateEstablishment: (id, data) => api.put(`/establishments/${id}`, data),
  deleteEstablishment: (id) => api.delete(`/establishments/${id}`),

  // Service Orders
  getServiceOrders: (filters = {}) => api.get('/service-orders', { params: filters }),
  getServiceOrder: (id) => api.get(`/service-orders/${id}`),
  createServiceOrder: (data) => api.post('/service-orders', data),
  updateServiceOrder: (id, data) => api.patch(`/service-orders/${id}`, data),

  // Dashboard
  getDashboardStats: () => api.get('/dashboard/stats'),
  getRecentOrders: (limit = 5) => api.get(`/dashboard/recent-orders?limit=${limit}`),
  getActiveOrders: () => api.get('/dashboard/active-orders'),
};

// Utility function to check auth state
export const checkAuth = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;

    const userData = await apiService.verifyToken();
    localStorage.setItem('user', JSON.stringify(userData));
    return userData;
  } catch (error) {
    console.error('Auth check failed:', error);
    localStorage.removeItem('token');
    return null;
  }
};

export default api;
