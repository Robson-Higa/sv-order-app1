import AdminDashboard from './dashboards/AdminDashboard';
import TechnicianDashboard from './dashboards/TechnicianDashboard';
import UserDashboard from './dashboards/UserDashboard';
import { useAuth } from '../contexts/AuthContext';
import { UserType } from '../types';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return <div>Carregando...</div>;

  if (user.userType === UserType.ADMIN) return <AdminDashboard />;
  if (user.userType === UserType.TECHNICIAN) return <TechnicianDashboard />;
  if (user.userType === UserType.END_USER) return <UserDashboard />;

  return <div>Acesso não autorizado</div>;
}
