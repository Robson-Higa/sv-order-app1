export const validateUserForm = (formData, setError) => {
  if (!formData.name.trim()) {
    setError('Nome é obrigatório');
    return false;
  }

  if (!formData.email.trim()) {
    setError('Email é obrigatório');
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email)) {
    setError('Email inválido');
    return false;
  }

  if (!formData.phone.trim()) {
    setError('Telefone é obrigatório');
    return false;
  }

  const digitsOnly = formData.phone.replace(/\D/g, '');
  if (digitsOnly.length !== 11) {
    setError('Telefone inválido. Informe DDD e número (ex: (99) 99999-9999)');
    return false;
  }

  if (!formData.password) {
    setError('Senha é obrigatória');
    return false;
  }

  if (formData.password.length < 6) {
    setError('Senha deve ter pelo menos 6 caracteres');
    return false;
  }

  if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
    setError('Senhas não coincidem');
    return false;
  }

  if (!formData.userType) {
    setError('Tipo de usuário é obrigatório');
    return false;
  }

  if (formData.userType === 'END_USER' && !formData.establishmentId) {
    setError('Estabelecimento é obrigatório para usuários finais');
    return false;
  }

  return true;
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

export const validatePassword = (password) => {
  return password.length >= 6;
};
