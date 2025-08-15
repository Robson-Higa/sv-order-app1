import { formatDuration, intervalToDuration } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function parseAtendentDate(startTime, completedAt) {
  if (!startTime?._seconds || !completedAt?._seconds) return '-';

  const startDate = new Date(startTime._seconds * 1000);
  const endDate = new Date(completedAt._seconds * 1000);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return '-';

  const duration = intervalToDuration({ start: startDate, end: endDate });

  return formatDuration(duration, {
    format: ['days', 'hours', 'minutes'],
    locale: ptBR,
  });
}
