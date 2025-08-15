// src/utils/toastUtils.js
import { toast } from 'react-hot-toast';

export const showSuccess = (message = 'Operação realizada com sucesso!') => {
  toast.success(message, {
    position: 'top-right',
    duration: 4000,
  });
};

export const showError = (message = 'Ocorreu um erro. Tente novamente.') => {
  toast.error(message, {
    position: 'top-right',
    duration: 5000,
  });
};
