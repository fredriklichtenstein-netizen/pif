// Lightweight debug bus for auth/messages/notifications hydration tracing.
// Enabled when the URL contains ?debug=1 OR localStorage.pif_debug === '1'.
// Logs go to console AND to an in-memory ring buffer that a floating UI panel
// renders. Safe no-op in production when disabled.

export type DebugEntry = {
  t: number;          // ms since page load
  scope: string;      // e.g. 'auth' | 'notifications' | 'conversations'
  msg: string;
  data?: unknown;
};

const MAX_ENTRIES = 200;
const buffer: DebugEntry[] = [];
const listeners = new Set<() => void>();
const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();

const isEnabled = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get("debug") === "1") {
      try { localStorage.setItem("pif_debug", "1"); } catch { /* ignore */ }
      return true;
    }
    if (url.searchParams.get("debug") === "0") {
      try { localStorage.removeItem("pif_debug"); } catch { /* ignore */ }
      return false;
    }
    return localStorage.getItem("pif_debug") === "1";
  } catch {
    return false;
  }
};

let cachedEnabled: boolean | null = null;
export const isDebugEnabled = (): boolean => {
  if (cachedEnabled === null) cachedEnabled = isEnabled();
  return cachedEnabled;
};

export const debugLog = (scope: string, msg: string, data?: unknown): void => {
  if (!isDebugEnabled()) return;
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  const entry: DebugEntry = { t: Math.round(now - t0), scope, msg, data };
  buffer.push(entry);
  if (buffer.length > MAX_ENTRIES) buffer.shift();
  // eslint-disable-next-line no-console
  console.log(`[${entry.t}ms][${scope}] ${msg}`, data ?? "");
  listeners.forEach((fn) => {
    try { fn(); } catch { /* ignore */ }
  });
};

export const getDebugEntries = (): DebugEntry[] => buffer.slice();

export const subscribeDebug = (fn: () => void): (() => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const clearDebug = (): void => {
  buffer.length = 0;
  listeners.forEach((fn) => fn());
};
