/**
 * "Safe mode" escape hatch.
 *
 * Append `?safe=1` to any URL to disable nonessential boot work:
 *   - realtime subscriptions
 *   - version polling / auto-reload
 *   - notification & unread counters
 *   - profile/interaction background revalidation
 *   - feed liked/interested hydration gating
 *
 * The app shell, navigation, routing, and primary data fetches still run.
 * This is a recovery & diagnostic tool: if the app loads in safe mode, the
 * shell is fine and the culprit is one of the disabled side effects.
 */

let cached: boolean | null = null;

export function isSafeMode(): boolean {
  if (cached !== null) return cached;
  try {
    if (typeof window === "undefined") return (cached = false);
    const params = new URLSearchParams(window.location.search);
    const flag = params.get("safe") === "1" || params.get("safeMode") === "1";
    if (flag) {
      try {
        window.sessionStorage.setItem("pif:safe-mode", "1");
      } catch {
        /* ignore */
      }
      return (cached = true);
    }
    try {
      if (window.sessionStorage.getItem("pif:safe-mode") === "1") {
        return (cached = true);
      }
    } catch {
      /* ignore */
    }
  } catch {
    /* ignore */
  }
  return (cached = false);
}

export function clearSafeMode(): void {
  cached = null;
  try {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("pif:safe-mode");
    }
  } catch {
    /* ignore */
  }
}
