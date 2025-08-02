import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../types';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
export function generateToken(user: User): string {
  return jwt.sign(
    { uid: user.uid, email: user.email, userType: user.userType },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );
}


export function sanitizeUser(user: User): Partial<User> {
  return {
    uid: user.uid,
    name: user.name,
    email: user.email,
    phone: user.phone,
    userType: user.userType,
    isActive: user.isActive,
    establishmentId: user.establishmentId || null,
    createdAt: user.createdAt || null,
    updatedAt: user.updatedAt || null,
    avatarUrl: user.avatarUrl || null, // garante que venha mesmo que seja vazio
    // Não expor password por segurança
  };
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

export function generateOrderNumber(): string {
  // Exemplo: OS-20240630-XYZ123
  const date = new Date();
  const dateStr = date.toISOString().slice(0,10).replace(/-/g, '');
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `OS-${dateStr}-${random}`;
}

