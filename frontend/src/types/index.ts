export interface User {
  id: string;
  name: string;
  email: string;
  userType: UserType;
  establishmentId?: string;
  establishment?: Establishment;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export enum UserType {
  ADMIN = 'admin',
  TECHNICIAN = 'technician',
  END_USER = 'end_user',
}

export interface Establishment {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceOrder {
  id: string;
  orderNumber?: string;
  title: string;
  description: string;
  status: ServiceOrderStatus;
  priority: Priority;
  userId: string;
  user?: User;
  technicianId?: string;
  technician?: User;
  establishmentId: string;
  establishment?: Establishment;
  scheduledDate?: string;
  completedAt?: string;
  userConfirmed: boolean;
  userFeedback?: string;
  userRating?: number;
  technicianNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export enum ServiceOrderStatus {
  OPEN = 'open',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  userType: UserType;
  establishmentId?: string;
}

export interface CreateServiceOrderRequest {
  title: string;
  description: string;
  establishmentId: string;
  priority: Priority;
  scheduledDate?: string;
}

export interface UpdateServiceOrderRequest {
  title?: string;
  description?: string;
  status?: ServiceOrderStatus;
  priority?: Priority;
  technicianId?: string;
  scheduledDate?: string;
  technicianNotes?: string;
  userFeedback?: string;
  userRating?: number;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  user?: User;
  users?: User[];
  technicians?: User[];
  token?: string;
  serviceOrder?: ServiceOrder;
  serviceOrders?: ServiceOrder[];
  establishment?: Establishment;
  establishments?: Establishment[];
  stats?: DashboardStats | TechnicianStats | AdminStats;
  recentOrders?: ServiceOrder[];
  activeOrders?: ServiceOrder[];
}

export interface DashboardStats {
  totalOrders: number;
  openOrders: number;
  inProgressOrders: number;
  completedOrders: number;
}

export interface TechnicianStats extends DashboardStats {
  assignedOrders: number;
  completionRate: number;
}

export interface AdminStats extends DashboardStats {
  totalUsers: number;
  totalTechnicians: number;
  totalEstablishments: number;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  loading: boolean;
}

// Tipos de navegação
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Main: undefined;
  ServiceOrderDetails: { orderId: string };
  CreateServiceOrder: undefined;
  EditServiceOrder: { orderId: string };
};

export type MainTabParamList = {
  Dashboard: undefined;
  ServiceOrders: undefined;
  Users: undefined;
  Establishments: undefined;
  Reports: undefined;
  Profile: undefined;
};

