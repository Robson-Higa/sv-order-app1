import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  User, 
  LoginRequest, 
  RegisterRequest, 
  ServiceOrder, 
  CreateServiceOrderRequest, 
  UpdateServiceOrderRequest,
  Establishment,
  ApiResponse,
  DashboardStats,
  TechnicianStats,
  AdminStats
} from '../types';

const API_BASE_URL = 'http://localhost:3000/api';

class ApiService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await AsyncStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = await this.getAuthHeaders();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Autenticação
  async login(credentials: LoginRequest): Promise<ApiResponse> {
    const response = await this.request<ApiResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.token) {
      await AsyncStorage.setItem('token', response.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  }

  async register(userData: RegisterRequest): Promise<ApiResponse> {
    const response = await this.request<ApiResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.token) {
      await AsyncStorage.setItem('token', response.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', { method: 'POST' });
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  }

  async getCurrentUser(): Promise<ApiResponse> {
    return this.request<ApiResponse>('/auth/me');
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    return this.request<ApiResponse>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Usuários
  async getUsers(): Promise<ApiResponse> {
    return this.request<ApiResponse>('/users');
  }

  async getUserById(id: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/users/${id}`);
  }

  async getTechnicians(): Promise<ApiResponse> {
    return this.request<ApiResponse>('/users/technicians');
  }

  async updateUser(id: string, userData: Partial<User>): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deactivateUser(id: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/users/${id}/deactivate`, {
      method: 'PATCH',
    });
  }

  async activateUser(id: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/users/${id}/activate`, {
      method: 'PATCH',
    });
  }

  async deleteUser(id: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Estabelecimentos
  async getEstablishments(): Promise<ApiResponse> {
    return this.request<ApiResponse>('/establishments');
  }

  async getEstablishmentById(id: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/establishments/${id}`);
  }

  async createEstablishment(establishmentData: Partial<Establishment>): Promise<ApiResponse> {
    return this.request<ApiResponse>('/establishments', {
      method: 'POST',
      body: JSON.stringify(establishmentData),
    });
  }

  async updateEstablishment(id: string, establishmentData: Partial<Establishment>): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/establishments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(establishmentData),
    });
  }

  async deleteEstablishment(id: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/establishments/${id}`, {
      method: 'DELETE',
    });
  }

  // Ordens de Serviço
  async getServiceOrders(filters?: {
    status?: string;
    establishmentId?: string;
    technicianId?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `/service-orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<ApiResponse>(endpoint);
  }

  async getServiceOrderById(id: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/service-orders/${id}`);
  }

  async createServiceOrder(orderData: CreateServiceOrderRequest): Promise<ApiResponse> {
    return this.request<ApiResponse>('/service-orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  async updateServiceOrder(id: string, orderData: UpdateServiceOrderRequest): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/service-orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
    });
  }

  async assignTechnician(orderId: string, technicianId: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/service-orders/${orderId}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ technicianId }),
    });
  }

  async cancelServiceOrder(orderId: string, reason: string): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/service-orders/${orderId}/cancel`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  async submitFeedback(orderId: string, feedback: string, rating: number): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/service-orders/${orderId}/feedback`, {
      method: 'PATCH',
      body: JSON.stringify({ userFeedback: feedback, userRating: rating }),
    });
  }

  // Dashboard
  async getDashboardData(): Promise<ApiResponse> {
    return this.request<ApiResponse>('/dashboard');
  }

  async getReports(filters?: {
    startDate?: string;
    endDate?: string;
    establishmentId?: string;
    technicianId?: string;
    status?: string;
  }): Promise<ApiResponse> {
    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value);
        }
      });
    }

    const endpoint = `/dashboard/reports${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<ApiResponse>(endpoint);
  }

  // Registros administrativos
  async registerAdmin(userData: RegisterRequest): Promise<ApiResponse> {
    return this.request<ApiResponse>('/auth/register-admin', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async registerTechnician(userData: RegisterRequest): Promise<ApiResponse> {
    return this.request<ApiResponse>('/auth/register-technician', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }
}

export const apiService = new ApiService();
export default apiService;

