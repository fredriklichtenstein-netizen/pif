import { create } from "zustand";

/**
 * Tiny shared store so the feed and map can announce when a refresh is
 * in flight. Either view increments the active counter when it starts
 * a refresh and decrements when it finishes; both views render their
 * overlay whenever `activeCount > 0`. A counter (rather than a boolean)
 * keeps things correct if both views happen to refresh concurrently.
 */
interface RefreshSyncState {
  activeCount: number;
  /** True when at least one view is currently refreshing. */
  isRefreshing: boolean;
  begin: () => void;
  end: () => void;
}

export const useRefreshSyncStore = create<RefreshSyncState>((set) => ({
  activeCount: 0,
  isRefreshing: false,
  begin: () =>
    set((s) => {
      const next = s.activeCount + 1;
      return { activeCount: next, isRefreshing: next > 0 };
    }),
  end: () =>
    set((s) => {
      const next = Math.max(0, s.activeCount - 1);
      return { activeCount: next, isRefreshing: next > 0 };
    }),
}));
