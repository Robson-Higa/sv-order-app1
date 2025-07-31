export interface AuthenticatedUser {
  uid: string;
  email: string;
  userType: 'ADMIN' | 'TECHNICIAN' | 'END_USER';
  establishmentId?: string;
  name?: string;
  phone?: string;
}
