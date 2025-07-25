// utils/formatters.js
export const formatPhoneToE164 = (phone) => {
  const digits = phone.replace(/\D/g, '');
  return `+55${digits}`;
};
