/**
 * Safe localStorage helpers that never throw, even when:
 *   - localStorage is unavailable (SSR, private mode, blocked cookies)
 *   - the stored value is corrupt / non-JSON (legacy PostGIS strings, etc.)
 *   - JSON.parse hits a quota or syntax error
 *
 * Use these wrappers anywhere a bad cached value could otherwise blow up
 * synchronously during app init and freeze the UI.
 */

const hasStorage = (): boolean => {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
};

/** Read a raw string from localStorage. Returns null on any failure. */
export function safeGetItem(key: string): string | null {
  if (!hasStorage()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Remove a key from localStorage, swallowing any error. */
export function safeRemoveItem(key: string): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Write a raw string to localStorage, swallowing any error. */
export function safeSetItem(key: string, value: string): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore (quota, private mode, etc.) */
  }
}

/**
 * Read and JSON.parse a localStorage value. Returns `fallback` when:
 *   - the key is missing
 *   - the value isn't valid JSON (e.g. legacy `(lng,lat)` strings)
 *   - the value doesn't pass the optional `validate` predicate
 *
 * On any failure the bad value is removed so it can't keep tripping.
 * Never throws.
 */
export function safeParseJSON<T>(
  key: string,
  fallback: T,
  validate?: (value: unknown) => value is T,
): T {
  const raw = safeGetItem(key);
  if (raw == null) return fallback;

  const trimmed = raw.trim();
  if (!trimmed || (trimmed[0] !== "{" && trimmed[0] !== "[" && trimmed[0] !== '"')) {
    // Almost certainly a legacy non-JSON value. Drop it.
    safeRemoveItem(key);
    return fallback;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    safeRemoveItem(key);
    return fallback;
  }

  if (validate && !validate(parsed)) {
    safeRemoveItem(key);
    return fallback;
  }

  return (parsed as T) ?? fallback;
}

/** JSON.stringify + safeSetItem. Never throws. */
export function safeStringify<T>(key: string, value: T): void {
  try {
    safeSetItem(key, JSON.stringify(value));
  } catch {
    /* ignore circular / serialization errors */
  }
}
