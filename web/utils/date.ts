import { format } from 'date-fns';
import { id as idLocale, enUS } from 'date-fns/locale';

/**
 * Format a date string for display
 */
export function formatDate(dateString: string, localeCode: string = 'en'): string {
  const date = new Date(dateString);
  return format(date, 'PP', { 
    locale: localeCode === 'id' ? idLocale : enUS 
  });
}

/**
 * Get days difference between two dates
 */
export function getDaysDifference(dateA: Date, dateB: Date): number {
  const diffTime = Math.abs(dateB.getTime() - dateA.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
