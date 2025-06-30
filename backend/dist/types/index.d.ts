import { Request } from 'express';
export interface User {
    id: string;
    email: string;
    name: string;
    userType: UserType;
    establishmentId?: string;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
    password?: string;
    lastLogin?: Date;
}
export declare enum UserType {
    ADMIN = "admin",
    TECHNICIAN = "technician",
    END_USER = "end_user"
}
export interface Establishment {
    id: string;
    name: string;
    address: string;
    phone?: string;
    email?: string;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
}
export interface ServiceOrder {
    id: string;
    orderNumber?: string;
    userId: string;
    technicianId?: string;
    establishmentId: string;
    title: string;
    description: string;
    status: ServiceOrderStatus;
    priority: Priority;
    createdAt: Date;
    updatedAt: Date;
    scheduledDate?: Date;
    completedDate?: Date;
    technicianNotes?: string;
    userFeedback?: string;
    userRating?: number;
    userConfirmed: boolean;
    cancellationReason?: string;
}
export declare enum ServiceOrderStatus {
    OPEN = "open",
    ASSIGNED = "assigned",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    CONFIRMED = "confirmed"
}
export declare enum Priority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    URGENT = "urgent"
}
export interface AuthRequest extends Request {
    user?: User;
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
    establishmentId: string;
    priority: Priority;
    scheduledDate?: Date;
}
export interface UpdateServiceOrderRequest {
    title?: string;
    description?: string;
    status?: ServiceOrderStatus;
    priority?: Priority;
    scheduledDate?: Date;
    technicianNotes?: string;
    userFeedback?: string;
    userRating?: number;
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
    user?: User;
}
//# sourceMappingURL=index.d.ts.map