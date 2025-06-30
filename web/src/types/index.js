export const UserType = {
  ADMIN: 'admin',
  TECHNICIAN: 'technician',
  END_USER: 'end_user',
};

export const ServiceOrderStatus = {
  OPEN: 'open',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
};

export const Priority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

export const getStatusText = (status) => {
  const statusMap = {
    'open': 'Aberta',
    'assigned': 'Atribuída',
    'in_progress': 'Em Progresso',
    'completed': 'Concluída',
    'confirmed': 'Confirmada',
    'cancelled': 'Cancelada',
  };
  return statusMap[status] || status;
};

export const getPriorityText = (priority) => {
  const priorityMap = {
    'low': 'Baixa',
    'medium': 'Média',
    'high': 'Alta',
    'urgent': 'Urgente',
  };
  return priorityMap[priority] || priority;
};

export const getUserTypeText = (userType) => {
  const userTypeMap = {
    'admin': 'Administrador',
    'technician': 'Técnico',
    'end_user': 'Usuário Final',
  };
  return userTypeMap[userType] || userType;
};

export const getStatusColor = (status) => {
  const colorMap = {
    'open': 'bg-yellow-100 text-yellow-800',
    'assigned': 'bg-blue-100 text-blue-800',
    'in_progress': 'bg-indigo-100 text-indigo-800',
    'completed': 'bg-green-100 text-green-800',
    'confirmed': 'bg-purple-100 text-purple-800',
    'cancelled': 'bg-red-100 text-red-800',
  };
  return colorMap[status] || 'bg-gray-100 text-gray-800';
};

export const getPriorityColor = (priority) => {
  const colorMap = {
    'low': 'text-green-600',
    'medium': 'text-yellow-600',
    'high': 'text-orange-600',
    'urgent': 'text-red-600',
  };
  return colorMap[priority] || 'text-gray-600';
};

