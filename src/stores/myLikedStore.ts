import { create } from "zustand";

/**
 * Tracks whether the current authenticated user has liked a given item.
 * Mirrored by useMyLikedIds (initial fetch + realtime) so per-card
 * "isLiked" state hydrates correctly on every mount/page refresh.
 */
interface MyLikedState {
  byItem: Record<string, boolean>;
  set: (itemId: string | number, value: boolean) => void;
  setMany: (entries: Array<{ itemId: string | number; value: boolean }>) => void;
  get: (itemId: string | number) => boolean | undefined;
}

export const useMyLikedStore = create<MyLikedState>((set, get) => ({
  byItem: {},
  set: (itemId, value) =>
    set((state) => ({ byItem: { ...state.byItem, [String(itemId)]: value } })),
  setMany: (entries) =>
    set((state) => {
      const next = { ...state.byItem };
      for (const e of entries) next[String(e.itemId)] = e.value;
      return { byItem: next };
    }),
  get: (itemId) => get().byItem[String(itemId)],
}));
