export const getUserRating = (order) => {
  // tenta várias chaves comuns e também dentro de user
  const candidates = [
    order.userRating,
    order.user_rating,
    order.rating,
    order.user?.rating,
    order.user?.userRating,
  ];

  const found = candidates.find((v) => v !== undefined && v !== null);
  // se for 0, exibimos 0; se não encontrado, '-'
  return found ?? '-';
};
