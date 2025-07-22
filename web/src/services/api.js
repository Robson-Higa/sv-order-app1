import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
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

export const apiService = {
  // Auth
  login: ({ idToken }) => api.post('/auth/login', { idToken }),

  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  changePassword: (currentPassword, newPassword) =>
    api.patch('/auth/change-password', { currentPassword, newPassword }),

  // Users
  getUsers: () => api.get('/users'),
  //getAllUsers: () => api.get('/users'),
  getTechnicians: () => api.get('/users/type/technician'),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, data) => api.patch(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  activateUser: (id) => api.patch(`/users/${id}/activate`),

  // Establishments
  getEstablishments: () => api.get('/establishments'),
  createEstablishment: (data) => api.post('/establishments', data),
  updateEstablishment: (id, data) => api.put(`/establishments/${id}`, data),
  deleteEstablishment: (id) => api.delete(`/establishments/${id}`),
  deactivateEstablishment: (id) => api.patch(`/establishments/${id}/deactivate`),
  activateEstablishment: (id) => api.patch(`/establishments/${id}/activate`),

  // Service Orders
  getServiceOrders: (filters = {}) => api.get('/service-orders', { params: filters }),
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
  getGeneralReport: async () => {
    const response = await axios.get('/reports/general');
    return response.data;
  },

  getOrdersByEstablishment: async () => {
    const response = await axios.get('/reports/by-establishment');
    return response;
  },

  getOrdersByTechnician: async () => {
    const response = await axios.get('/reports/by-technician');
    return response;
  },

  getOrdersByPeriod: (startDate, endDate) =>
    api.get('/reports/by-period', { params: { startDate, endDate } }),
};

export async function getEndUsers() {
  const response = await api.get('/users/type/END_USER');
  return response.users;
}

export async function fetchTechnicians() {
  const q = query(collection(db, 'users'), where('userType', '==', 'TECHNICIAN'));
  const snapshot = await getDocs(q);
  const technicians = snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
  return technicians;
}

export async function fetchEstablishments() {
  const snapshot = await getDocs(collection(db, 'establishments'));
  const establishments = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return establishments;
}
