/**
 * Safe storage helpers that never throw, even when:
 *   - storage is unavailable (SSR, private mode, blocked cookies)
 *   - the stored value is corrupt / non-JSON (legacy PostGIS strings, etc.)
 *   - JSON.parse hits a quota or syntax error
 *
 * Use these wrappers anywhere a bad cached value could otherwise blow up
 * synchronously during app init and freeze the UI.
 *
 * Pass `"session"` as the last arg to operate on sessionStorage instead
 * of localStorage. Defaults to localStorage.
 */

type StorageKind = "local" | "session";

const pick = (kind: StorageKind = "local"): Storage | null => {
  try {
    if (typeof window === "undefined") return null;
    return kind === "session" ? window.sessionStorage : window.localStorage;
  } catch {
    return null;
  }
};

/** Read a raw string. Returns null on any failure. */
export function safeGetItem(key: string, kind: StorageKind = "local"): string | null {
  const s = pick(kind);
  if (!s) return null;
  try {
    return s.getItem(key);
  } catch {
    return null;
  }
}

/** Remove a key, swallowing any error. */
export function safeRemoveItem(key: string, kind: StorageKind = "local"): void {
  const s = pick(kind);
  if (!s) return;
  try {
    s.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Write a raw string, swallowing any error. */
export function safeSetItem(key: string, value: string, kind: StorageKind = "local"): void {
  const s = pick(kind);
  if (!s) return;
  try {
    s.setItem(key, value);
  } catch {
    /* ignore (quota, private mode, etc.) */
  }
}

/**
 * Read and JSON.parse a stored value. Returns `fallback` when:
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
  kind: StorageKind = "local",
): T {
  const raw = safeGetItem(key, kind);
  if (raw == null) return fallback;

  const trimmed = raw.trim();
  if (!trimmed || (trimmed[0] !== "{" && trimmed[0] !== "[" && trimmed[0] !== '"')) {
    safeRemoveItem(key, kind);
    return fallback;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    safeRemoveItem(key, kind);
    return fallback;
  }

  if (validate && !validate(parsed)) {
    safeRemoveItem(key, kind);
    return fallback;
  }

  return (parsed as T) ?? fallback;
}

/** JSON.stringify + safeSetItem. Never throws. */
export function safeStringify<T>(key: string, value: T, kind: StorageKind = "local"): void {
  try {
    safeSetItem(key, JSON.stringify(value), kind);
  } catch {
    /* ignore circular / serialization errors */
  }
}
