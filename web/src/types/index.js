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
  FINALIZADO: 'finalizado',
};

export const Priority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

export const getStatusText = (status) => {
  const statusMap = {
    open: 'Aberta',
    assigned: 'Atribuída',
    in_progress: 'Em Progresso',
    completed: 'Concluída',
    confirmed: 'Confirmada',
    cancelled: 'Cancelada',
    finalizado: 'Finalizado',
  };
  return statusMap[status] || status;
};

export const getPriorityText = (priority) => {
  const priorityMap = {
    low: 'Baixa',
    medium: 'Média',
    high: 'Alta',
    urgent: 'Urgente',
  };
  return priorityMap[priority] || priority;
};

export const getUserTypeText = (userType) => {
  const userTypeMap = {
    admin: 'Administrador',
    technician: 'Técnico',
    end_user: 'Usuário Final',
  };
  return userTypeMap[userType] || userType;
};

export const getStatusColor = (status) => {
  const colorMap = {
    open: 'variant-warning',
    assigned: 'variant-info',
    in_progress: 'variant-secondary',
    IN_PROGRESS: 'variant-secondary',
    completed: 'variant-success',
    COMPLETED: 'variant-success',
    confirmed: 'variant-primary',
    cancelled: 'variant-destructive',
    finalizado: 'variant-default',
    paused: 'variant-warning',
    PAUSED: 'variant-warning',
    reactivated: 'variant-info',
  };
  return colorMap[status] || 'variant-default';
};

export const getPriorityColor = (priority) => {
  const colorMap = {
    low: 'text-success',
    medium: 'text-warning',
    high: 'text-warning font-semibold',
    urgent: 'text-destructive font-semibold',
  };
  return colorMap[priority] || 'text-muted-foreground';
};
