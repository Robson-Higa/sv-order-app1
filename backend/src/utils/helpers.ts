import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../types';
import { UserType } from '../types';

export async function verifyToken(token: string): Promise<Partial<User> | null> {
  try {
    if (!token) return null;

    // Decodifica o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
      uid: string;
      email: string;
      userType: string;
    };

    // Converte string para enum UserType
    let userTypeEnum: UserType | undefined;
    if (decoded.userType === 'ADMIN') userTypeEnum = UserType.ADMIN;
    else if (decoded.userType === 'TECHNICIAN') userTypeEnum = UserType.TECHNICIAN;
    else if (decoded.userType === 'END_USER') userTypeEnum = UserType.END_USER;

    return {
      uid: decoded.uid,
      email: decoded.email,
      userType: userTypeEnum, // agora está do tipo correto
    };
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return null;
  }
}
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
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `OS-${dateStr}-${random}`;
}
