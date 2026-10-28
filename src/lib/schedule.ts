// Time rules for scheduled posts. The database enforces the same bounds
// (_item_drafts_before_write: not in the past, at most 30 days ahead); the
// cron job runs every 5 minutes, so times are offered in 5-minute steps.

export const SCHEDULE_STEP_MINUTES = 5;
export const SCHEDULE_MIN_LEAD_MINUTES = 10;
export const SCHEDULE_MAX_DAYS = 30;

const MINUTE = 60_000;

export function roundUpToStep(date: Date, stepMinutes = SCHEDULE_STEP_MINUTES): Date {
  const step = stepMinutes * MINUTE;
  const ms = date.getTime();
  const floored = Math.floor(ms / step) * step;
  return new Date(floored === ms ? ms : floored + step);
}

export function minScheduleDate(now: Date = new Date()): Date {
  return roundUpToStep(new Date(now.getTime() + SCHEDULE_MIN_LEAD_MINUTES * MINUTE));
}

export function maxScheduleDate(now: Date = new Date()): Date {
  const step = SCHEDULE_STEP_MINUTES * MINUTE;
  const max = now.getTime() + SCHEDULE_MAX_DAYS * 24 * 60 * MINUTE;
  return new Date(Math.floor(max / step) * step);
}

export type ScheduleError = "invalid" | "too_soon" | "too_far";

export function validateSchedule(date: Date | null, now: Date = new Date()): ScheduleError | null {
  if (!date || Number.isNaN(date.getTime())) return "invalid";
  if (date.getTime() < now.getTime() + (SCHEDULE_MIN_LEAD_MINUTES - SCHEDULE_STEP_MINUTES) * MINUTE) {
    return "too_soon";
  }
  if (date.getTime() > maxScheduleDate(now).getTime()) return "too_far";
  return null;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Local-time value for <input type="datetime-local">, e.g. "2026-11-01T09:00". */
export function toLocalInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Parses a datetime-local value as the browser's local time. */
export function fromLocalInputValue(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number);
  const date = new Date(y, mo - 1, d, h, mi, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** e.g. "lör 1 nov. 09:00" / "Sat 1 Nov, 09:00". */
export function formatScheduleTime(date: Date, language: string): string {
  return date.toLocaleString(language === "en" ? "en-GB" : "sv-SE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
