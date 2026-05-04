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
      entries.forEach((e) => {
        const key = String(e.itemId);
        const prev = next[key] || { likesCount: 0, commentsCount: 0, interestsCount: 0 };
        next[key] = {
          likesCount: e.likesCount ?? prev.likesCount,
          commentsCount: e.commentsCount ?? prev.commentsCount,
          interestsCount: e.interestsCount ?? prev.interestsCount,
          bookmarksCount: e.bookmarksCount ?? prev.bookmarksCount,
        };
      });
      return { counts: next };
    }),
  getCounts: (itemId) => get().counts[String(itemId)],
}));
