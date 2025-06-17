
import { format, formatDistanceToNow, isThisYear, differenceInDays } from "date-fns";
import { sv, enUS } from "date-fns/locale";
import i18n from '@/i18n';

const getLocale = () => {
  const currentLang = i18n.language || 'sv';
  return currentLang === 'sv' ? sv : enUS;
};

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInDays = differenceInDays(now, date);
  const locale = getLocale();
  
  // Less than 7 days: use relative time (minutes, hours, days)
  if (diffInDays < 7) {
    return formatDistanceToNow(date, { addSuffix: true, locale });
  }
  
  // Less than a year: format as "Month Day" (e.g., "April 5th")
  if (isThisYear(date)) {
    return format(date, "MMMM do", { locale });
  }
  
  // More than a year: format as "YYYY-MM-DD"
  return format(date, "yyyy-MM-dd", { locale });
}

export function formatShortDate(date: Date): string {
  const locale = getLocale();
  return format(date, "MMM d", { locale });
}

export function formatLongDate(date: Date): string {
  const locale = getLocale();
  return format(date, "MMMM d, yyyy", { locale });
}
