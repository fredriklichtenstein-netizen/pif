import { create } from "zustand";

export interface InitialCounts {
  likesCount: number;
  commentsCount: number;
  interestsCount: number;
  bookmarksCount?: number;
}

interface InitialCountsState {
  counts: Record<string, InitialCounts>;
  setBulkCounts: (entries: Array<{ itemId: string | number } & Partial<InitialCounts>>) => void;
  getCounts: (itemId: string | number) => InitialCounts | undefined;
}

export const useInitialCountsStore = create<InitialCountsState>((set, get) => ({
  counts: {},
  setBulkCounts: (entries) =>
    set((state) => {
      const next = { ...state.counts };
      let changed = false;
      entries.forEach((e) => {
        const key = String(e.itemId);
        const prev = next[key] || { likesCount: 0, commentsCount: 0, interestsCount: 0 };
        const updated = {
          likesCount: e.likesCount ?? prev.likesCount,
          commentsCount: e.commentsCount ?? prev.commentsCount,
          interestsCount: e.interestsCount ?? prev.interestsCount,
          bookmarksCount: e.bookmarksCount ?? prev.bookmarksCount,
        };
        if (
          updated.likesCount !== prev.likesCount ||
          updated.commentsCount !== prev.commentsCount ||
          updated.interestsCount !== prev.interestsCount ||
          updated.bookmarksCount !== prev.bookmarksCount
        ) {
          next[key] = updated;
          changed = true;
        }
      });
      if (!changed) return state;
      return { counts: next };
    }),
  getCounts: (itemId) => get().counts[String(itemId)],
}));
