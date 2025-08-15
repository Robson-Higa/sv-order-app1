import { Request } from 'express';

export interface User {
  uid: string;
  email: string; // Agora obrigatório
  name: string;
  phone?: string;
  userType: UserType;
  establishmentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  password?: string;
  avatarUrl?: null | string; // URL do avatar, pode ser null se não houver avatar
}

export enum UserType {
  ADMIN = 'admin',
  TECHNICIAN = 'technician',
  END_USER = 'end_user',
}

export interface Establishment {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface ServiceOrder {
  id: string;
  orderNumber: string;
  title?: string;
  description: string;
  priority: Priority;
  status: ServiceOrderStatus;
  establishmentId?: string;
  establishmentName: string;
  technicianId?: string;
  technicianName: string;
  technician?: {
    id: string;
    name: string;
    email?: string;
  };
  user?: {
    id: string;
    name: string;
    email?: string;
  };
  establishment?: {
    id: string;
    name: string;
    address?: string;
  };
  userId?: string;
  userName?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  confirmedAt?: Date;
  scheduledAt?: Date; // Novo campo para agendamento do atendimento
  technicianNotes?: string;
  userFeedback?: string;
  userRating?: number;
  cancellationReason?: {
    reason: string;
    createdAt: Date;
  } | null;
  pauseReason?: {
    reason: string;
    createdAt: Date;
  } | null;
  feedback?: string;
  useConfirmed?: boolean;
  startTime?: Date;
  endTime?: Date;

  cancelledBy?: { uid: string; name: string };
  //pauseReason?: string;
  pausedBy?: { uid: string; name: string };
}

export enum ServiceOrderStatus {
  OPEN = 'open',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  CONFIRMED = 'confirmed',
  PENDING = 'pending',
  PAUSED = 'paused',
  REOPENED = 'reopened',
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  userType: UserType;
  establishmentId?: string;
}

export interface CreateServiceOrderRequest {
  title: string;
  description: string;
  priority: Priority;
  establishmentName: string;
  technicianName: string;
  scheduledAt?: Date; // Atualizado para scheduledAt
}

export interface UpdateServiceOrderRequest {
  title?: string;
  description?: string;
  status?: ServiceOrderStatus;
  priority?: Priority;
  scheduledAt?: Date; // Atualizado para scheduledAt
  technicianNotes?: string;
  userFeedback?: string;
  userRating?: number;
  startTime?: Date;
  endTime?: Date;
}

export interface DashboardStats {
  totalOrders: number;
  openOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageRating: number;
  ordersThisMonth: number;
  ordersLastMonth: number;
}

export interface TechnicianStats extends DashboardStats {
  assignedOrders: number;
  completionRate: number;
}

export interface AdminStats extends DashboardStats {
  totalUsers: number;
  totalTechnicians: number;
  totalEstablishments: number;
  activeUsers: number;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export interface AuthenticatedUser {
  uid: string;
  email: string;
  userType: UserType; // Use o enum UserType para manter compatibilidade
  name?: string;
  phone?: string;
  establishmentId?: string | null;
  createdAt?: Date;
}
