export function formatDate(date) {
  if (!date || !date.seconds) return '-';
  const jsDate = new Date(date.seconds * 1000);
  return jsDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
