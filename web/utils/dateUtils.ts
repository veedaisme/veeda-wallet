import { format, startOfWeek, addDays, startOfMonth, addWeeks, endOfWeek, endOfMonth, subMonths, isSameMonth, Locale } from 'date-fns';
// Potentially import specific locales if needed, e.g., idLocale from 'date-fns/locale/id'

/**
 * Gets an array of day strings (e.g., "Mon", "Tue") for a week, starting from a given date.
 * @param start The start date of the week.
 * @param locale The date-fns locale object.
 * @returns An array of 7 day strings.
 */
export const getWeekDays = (start: Date, locale: Locale): string[] => {
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(format(addDays(start, i), "EEE", { locale }));
  }
  return days;
};

/**
 * Gets an array of week start and end dates for a given month range.
 * @param monthStart The start date of the month.
 * @param monthEnd The end date of the month.
 * @param locale The date-fns locale object.
 * @returns An array of objects, each with 'start' and 'end' date properties for a week.
 */
export const getMonthWeeks = (monthStart: Date, monthEnd: Date, locale: Locale): { start: Date; end: Date; name: string }[] => {
  const weeks = [];
  let currentWeekStart = startOfWeek(monthStart, { locale });

  while (currentWeekStart <= monthEnd) {
    const currentWeekEnd = endOfWeek(currentWeekStart, { locale });
    weeks.push({
      start: currentWeekStart,
      end: isSameMonth(currentWeekEnd, monthStart) ? currentWeekEnd : monthEnd, // Ensure week end does not exceed month end
      name: `W${format(currentWeekStart, 'w', { locale })}`
    });
    currentWeekStart = addWeeks(currentWeekStart, 1);
  }
  return weeks;
};

// Add other date utility functions here
