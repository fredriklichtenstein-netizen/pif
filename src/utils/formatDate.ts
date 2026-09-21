
import { format, formatDistanceToNow, isThisYear, isYesterday, differenceInDays } from "date-fns";
import { sv, enUS } from "date-fns/locale";
import i18n from '@/i18n';

const getLocale = () => {
  const currentLang = i18n.language || 'sv';
  return currentLang === 'sv' ? sv : enUS;
};

/**
 * Shared by CommentHeader, ItemCardHeader (post timestamps) and
 * ItemArchivedBanner -- improving it here improves all three at once.
 * Trello feedback: match this to "posted 5 min ago" / "posted yesterday" /
 * "posted 4 days ago" / "posted December 5th" (sv: "publicerad den 5:e
 * december") -- the "posted"/"publicerad" prefix is added by each caller's
 * own translation string; this function only produces the time part.
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInDays = differenceInDays(now, date);
  const locale = getLocale();

  // Under 24h elapsed: relative time ("5 minutes ago", "3 hours ago").
  // Checked before the calendar-based "yesterday" case below so a post
  // from 40 minutes ago that happened to cross midnight still reads as
  // "40 minutes ago", not "yesterday" -- matches standard feed UX
  // (Twitter/Facebook do the same).
  if (diffInDays < 1) {
    return formatDistanceToNow(date, { addSuffix: true, locale });
  }

  // Calendar-yesterday (date-fns' isYesterday, not diffInDays === 1 --
  // those disagree near midnight, and calendar day is what a reader means
  // by "yesterday").
  if (isYesterday(date)) {
    return i18n.t('common.yesterday');
  }

  // 2-6 days ago: relative time again ("4 days ago").
  if (diffInDays < 7) {
    return formatDistanceToNow(date, { addSuffix: true, locale });
  }

  // Less than a year: "December 5th" (en) vs "den 5:e december" (sv) --
  // Swedish puts the ordinal day before the month, the reverse of
  // English's "Month day", so this can't share one format string across
  // locales the way the old code assumed.
  if (isThisYear(date)) {
    return i18n.language === 'sv'
      ? format(date, "'den' do MMMM", { locale })
      : format(date, "MMMM do", { locale });
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
