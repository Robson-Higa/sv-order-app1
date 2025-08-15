import { User } from '../types';
export declare const hashPassword: (password: string) => Promise<string>;
export declare const comparePassword: (password: string, hashedPassword: string) => Promise<boolean>;
export declare const generateToken: (user: User) => string;
export declare const generateId: () => string;
export declare const formatDate: (date: Date) => string;
export declare const calculateDaysBetween: (startDate: Date, endDate: Date) => number;
export declare const sanitizeUser: (user: User) => Omit<User, "password">;
export declare const validateEmail: (email: string) => boolean;
export declare const validatePhone: (phone: string) => boolean;
export declare const formatPhone: (phone: string) => string;
export declare const generateOrderNumber: () => string;
//# sourceMappingURL=helpers.d.ts.map