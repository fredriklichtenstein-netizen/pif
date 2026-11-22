// Where the reader was in the feed, so coming back from another page within a
// few minutes lands on the same spot instead of the top (Trello #123).
//
// In memory only (a reload starts at the top). The feed hook records how many
// pages were loaded, the Feed page records the scroll offset; both read it
// back on the next mount. The two are written independently (React runs the
// page's and the hook's unmount cleanups in either order). Kept shorter than
// React Query's gcTime (5 min), so the pages it refers to are still cached.

export const FEED_POSITION_MAX_AGE_MS = 4 * 60 * 1000;

interface Remembered<T> {
  value: T;
  at: number;
}

let page: Remembered<{ includeInactive: boolean; page: number }> | null = null;
let scroll: Remembered<number> | null = null;

const fresh = <T>(r: Remembered<T> | null, now: number) =>
  r && now - r.at <= FEED_POSITION_MAX_AGE_MS ? r.value : null;

export function rememberFeedPage(includeInactive: boolean, pageIndex: number, now = Date.now()): void {
  page = { value: { includeInactive, page: Math.max(0, pageIndex) }, at: now };
}

export function rememberFeedScroll(scrollY: number, now = Date.now()): void {
  scroll = { value: Math.max(0, Math.round(scrollY)), at: now };
}

/** How many pages to reload for this scope, if the reader left recently. */
export function recentFeedPage(includeInactive: boolean, now = Date.now()): number | null {
  const p = fresh(page, now);
  return p && p.includeInactive === includeInactive ? p.page : null;
}

/** Where to scroll back to, if the reader left recently. */
export function recentFeedScrollY(now = Date.now()): number | null {
  return fresh(scroll, now);
}

export function forgetFeedPosition(): void {
  page = null;
  scroll = null;
}
