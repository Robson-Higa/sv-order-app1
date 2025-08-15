import { format } from 'date-fns';

export function formatDate(date) {
  if (!date) return '-';

  try {
    let parsedDate;

    if (date instanceof Date) {
      parsedDate = date;
    } else if (typeof date === 'object') {
      // Aceita tanto 'seconds' quanto '_seconds'
      const seconds = date.seconds ?? date._seconds;
      if (seconds) {
        parsedDate = new Date(seconds * 1000);
      }
    } else if (typeof date === 'string' || typeof date === 'number') {
      parsedDate = new Date(date);
    } else {
      return '-';
    }

    if (!parsedDate || isNaN(parsedDate.getTime())) return '-';

    return format(parsedDate, 'dd/MM/yyyy HH:mm');
  } catch (error) {
    console.error('Erro ao formatar data:', date, error);
    return '-';
  }
}

export function parseToDate(date) {
  if (!date) return null;

  if (date instanceof Date) {
    return date;
  } else if (typeof date === 'object') {
    const seconds = date.seconds ?? date._seconds;
    if (seconds) {
      return new Date(seconds * 1000);
    }
  } else if (typeof date === 'string' || typeof date === 'number') {
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  return null;
}
