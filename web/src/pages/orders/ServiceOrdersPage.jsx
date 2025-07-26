import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminServiceOrders from '@/pages/orders/AdminServiceOrders';
import TechnicianServiceOrders from '@/pages/orders/TechnicianServiceOrders';
import UserServiceOrders from '@/pages/orders/UserServiceOrders';

const ServiceOrdersPage = () => {
  const { user } = useAuth();

  if (!user) return <p>Carregando...</p>;

  switch (user.userType.toUpperCase()) {
    case 'ADMIN':
      return <AdminServiceOrders />;
    case 'TECHNICIAN':
      return <TechnicianServiceOrders />;
    case 'END_USER':
      return <UserServiceOrders />;
    default:
      return <p>Tipo de usuário inválido.</p>;
  }
};

export default ServiceOrdersPage;
