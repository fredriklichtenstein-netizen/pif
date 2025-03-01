
import { format, formatDistanceToNow, isThisYear, differenceInDays } from "date-fns";

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInDays = differenceInDays(now, date);
  
  // Less than 7 days: use relative time (minutes, hours, days)
  if (diffInDays < 7) {
    return formatDistanceToNow(date, { addSuffix: true });
  }
  
  // Less than a year: format as "Month Day" (e.g., "April 5th")
  if (isThisYear(date)) {
    return format(date, "MMMM do");
  }
  
  // More than a year: format as "YYYY-MM-DD"
  return format(date, "yyyy-MM-dd");
}
